import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import ts from 'typescript';

// Every URL is fulfilled or aborted: these tests never contact a public host.
const ID = '11111111-1111-4111-8111-111111111111';
const SCRIPT = 'https://rpcrate.com/_sr/s.js';
const COLLECT = 'https://rpcrate.com/_sr/api/send';
const client = ts.transpileModule(
  readFileSync(new URL('../../src/lib/umami.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;
const tracker = process.env.UMAMI_FIXTURE_SCRIPT
  ? readFileSync(process.env.UMAMI_FIXTURE_SCRIPT, 'utf8')
  : `window.umami={track:async payload=>{await fetch(${JSON.stringify(COLLECT)},
      {method:'POST',body:JSON.stringify({type:'event',payload})});}};`;

async function fixture(page: import('@playwright/test').Page, path = '/', expectedPath = '/', id = ID) {
  const posts: unknown[] = [];
  let scriptLoads = 0;
  let scriptReferrer: string | undefined;
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (request.url() === SCRIPT) {
      scriptLoads++;
      scriptReferrer = request.headers().referer;
      await route.fulfill({ contentType: 'text/javascript', body: tracker });
    } else if (request.url() === COLLECT) {
      if (request.method() === 'POST') posts.push(request.postDataJSON());
      await route.fulfill({ contentType: 'application/json', body: '{}', headers: {
        'access-control-allow-origin': 'https://lkmedia.net',
        'access-control-allow-headers': 'content-type,x-umami-hostname,x-umami-website-id',
      } });
    } else if (new URL(request.url()).hostname === 'lkmedia.net') {
      await route.fulfill({ contentType: 'text/html', body: `<title>Public fixture</title>
        <script type="module">${client}
          startUmami(${JSON.stringify(id)},${JSON.stringify(expectedPath)});
          startUmami(${JSON.stringify(id)},${JSON.stringify(expectedPath)});
          window.fixtureReady=true;
        </script>` });
    } else await route.abort();
  });
  await page.goto(`https://lkmedia.net${path}`, { referer: 'https://source.example/?email=PRIVATE#PRIVATE' });
  await page.waitForFunction(() => (window as Window & { fixtureReady?: boolean }).fixtureReady);
  return { posts, loads: () => scriptLoads, scriptReferrer: () => scriptReferrer };
}

test('one public pageview omits query, hash and referrer despite duplicate initialization', async ({ page }) => {
  const f = await fixture(page, '/?q=PRIVATE&campaign=PRIVATE#PRIVATE');
  await expect.poll(() => f.posts.length).toBe(1);
  expect(f.posts).toEqual([{ type: 'event', payload: {
    website: ID, hostname: 'lkmedia.net', url: '/', title: 'Public fixture', referrer: '',
  } }]);
  expect(f.loads()).toBe(1);
  expect(f.scriptReferrer()).toBeUndefined();
  const flags = await page.locator('#lkmedia-umami-script').evaluate((script) => ({
    auto: script.getAttribute('data-auto-track'),
    search: script.getAttribute('data-exclude-search'),
    hash: script.getAttribute('data-exclude-hash'),
  }));
  expect(flags).toEqual({ auto: 'false', search: 'true', hash: 'true' });
  await page.waitForTimeout(400); // catches Umami's delayed automatic navigation/pageview path
  expect(f.posts).toHaveLength(1);
});

for (const [path, owner] of [
  ['/aenderung?session_id=PRIVATE', '/aenderung'], ['/docweb/onboarding', '/docweb/onboarding'],
  ['/danke', '/danke'], ['/en/thanks', '/en/thanks'], ['/link/PRIVATE', '/link/PRIVATE'],
  ['/?token=PRIVATE', '/'], ['/#token=PRIVATE', '/'], ['/unknown/PRIVATE', '/'],
]) {
  test(`does not even load a tracker on ${path}`, async ({ page }) => {
    const f = await fixture(page, path, owner);
    expect(f.loads()).toBe(0);
    expect(f.posts).toEqual([]);
  });
}

for (const signal of ['DNT', 'GPC']) {
  test(`does not load a tracker with ${signal}`, async ({ page }) => {
    await page.addInitScript((signal) => {
      Object.defineProperty(navigator, signal === 'DNT' ? 'doNotTrack' : 'globalPrivacyControl', {
        value: signal === 'DNT' ? '1' : true, configurable: true,
      });
    }, signal);
    const f = await fixture(page);
    expect(f.loads()).toBe(0);
    expect(f.posts).toEqual([]);
  });
}

test('an unset ID stays disabled', async ({ page }) => {
  const f = await fixture(page, '/', '/', '');
  expect(f.loads()).toBe(0);
  expect(f.posts).toEqual([]);
});

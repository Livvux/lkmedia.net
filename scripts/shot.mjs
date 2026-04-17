import { chromium } from 'playwright';
const urls = ['https://patricks-fahrschule.de','https://me-reifen.de','https://pm-plakatwerbung.de'];
const browser = await chromium.launch();
for (const u of urls) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }});
  try {
    await page.goto(u, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);
    const host = new URL(u).hostname;
    await page.screenshot({ path: `/tmp/${host}.png`, fullPage: false });
    console.log(host, 'ok');
  } catch(e) { console.log(u, 'err', e.message.slice(0,80)); }
  await page.close();
}
await browser.close();

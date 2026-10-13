// Test-only boundaries. The built application's payment gates, APIs, validation, GitHub client
// and email generation remain real. Never load this preload in a production process.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';

if (process.env.PURCHASE_E2E !== '1' || process.env.HOST !== '127.0.0.1' ||
    process.env.STRIPE_SECRET_KEY !== 'sk_test_local_fixture') {
  throw new Error('Purchase fixture requires an isolated local test process');
}
const products = {};
for (const [name, module, path] of [
  ['docweb', 'docweb', '/docweb'],
  ['handwerkweb', 'handwerkweb', '/handwerk'],
  ['fahrschulweb', 'fahrschulweb', '/fahrschule-webdesign'],
]) {
  const source = await readFile(new URL(`../../src/lib/${module}.ts`, import.meta.url), 'utf8');
  const link = source.match(/paymentLink: "([^"]+)"/)?.[1];
  const linkId = source.match(/paymentLinkId: "([^"]+)"/)?.[1];
  if (!link || !linkId) throw new Error(`Missing payment configuration: ${name}`);
  products[name] = { path, link, linkId, session: `cs_test_local${name}` };
}
const sessions = new Map();
const issues = [];
const comments = new Map();
const blobs = new Map();
const trees = new Map([['initial', []]]);
const commits = new Map([['initial', { tree: { sha: 'initial' } }]]);
let head = 'initial';
let seq = 0;
const mail = [];
const stripeChecks = [];
const json = (data, status = 200) => Response.json(data, { status });

// Nodemailer still generates the actual MIME message and attachments; the transport is a sink.
const createTransport = nodemailer.createTransport.bind(nodemailer);
nodemailer.createTransport = () => {
  const transport = createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  const send = transport.sendMail.bind(transport);
  transport.sendMail = async (options) => {
    const result = await send(options);
    mail.push({ to: options.to, subject: options.subject, text: options.text,
      attachments: (options.attachments ?? []).map(a => ({ filename: a.filename,
        content: Buffer.from(a.content).toString('base64') })),
      mime: result.message.toString('utf8') });
    return result;
  };
  return transport;
};

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const method = options.method ?? 'GET';
  if (url.origin === 'https://api.stripe.com') {
    const id = url.pathname.split('/').at(-1);
    const session = sessions.get(id);
    stripeChecks.push({ id, paid: session?.payment_status === 'paid', link: session?.payment_link });
    return session ? json(session) : json({ error: 'unknown session' }, 404);
  }
  if (url.origin !== 'https://api.github.com') throw new Error(`Unexpected external request: ${url.origin}`);
  const path = url.pathname.replace(/^\/repos\/Livvux\/kunden\//, '');
  const body = options.body ? JSON.parse(options.body) : null;
  if (path === 'contents/kunden.yaml') return new Response('[]');
  if (path.startsWith('git/ref/')) return json({ object: { sha: head } });
  if (path.startsWith('git/commits/') && method === 'GET') return json(commits.get(path.split('/').at(-1)));
  if (path === 'git/blobs') {
    const sha = `blob${++seq}`; blobs.set(sha, body.content); return json({ sha });
  }
  if (path === 'git/trees') {
    const sha = `tree${++seq}`;
    const previous = trees.get(body.base_tree) ?? [];
    trees.set(sha, [...previous.filter(p => !body.tree.some(n => n.path === p.path)), ...body.tree]);
    return json({ sha });
  }
  if (path === 'git/commits') {
    const sha = `commit${++seq}`; commits.set(sha, { ...body, tree: { sha: body.tree } }); return json({ sha });
  }
  if (path.startsWith('git/refs/') && method === 'PATCH') { head = body.sha; return json({}); }
  if (path === 'issues' && method === 'POST') {
    const issue = { ...body, number: issues.length + 1, state: 'open',
      created_at: new Date().toISOString(), html_url: `https://github.com/Livvux/kunden/issues/${issues.length + 1}` };
    issues.push(issue); return json(issue, 201);
  }
  if (path === 'issues' && method === 'GET') {
    const labels = url.searchParams.get('labels')?.split(',') ?? [];
    const state = url.searchParams.get('state') ?? 'open';
    return json(issues.filter(i => (state === 'all' || i.state === state) && labels.every(l => i.labels.includes(l))));
  }
  const match = path.match(/^issues\/(\d+)(?:\/comments)?$/);
  if (match) {
    const nr = Number(match[1]);
    if (path.endsWith('/comments')) {
      if (method === 'POST') {
        comments.set(nr, [...(comments.get(nr) ?? []), { ...body, created_at: new Date().toISOString() }]);
        return json({});
      }
      return json(comments.get(nr) ?? []);
    }
    if (method === 'PATCH') { Object.assign(issues.find(i => i.number === nr), body); return json({}); }
  }
  throw new Error(`Unhandled fixture endpoint: ${method} ${path}`);
};

const control = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:4328');
  const product = products[url.searchParams.get('product')];
  if (url.pathname === '/checkout' && product) {
    sessions.set(product.session, { payment_status: 'unpaid', payment_link: product.linkId,
      customer_details: { email: `${url.searchParams.get('product')}@example.test` } });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<h1>Lokaler Checkout-Test</h1><form method="POST" action="http://localhost:4328/pay?product=${url.searchParams.get('product')}"><button>Zahlung im Test bestätigen</button></form>`);
    return;
  }
  if (url.pathname === '/pay' && req.method === 'POST' && product) {
    sessions.get(product.session).payment_status = 'paid';
    res.writeHead(303, { Location: `http://localhost:4327${product.path}/onboarding?session_id=${product.session}` });
    res.end(); return;
  }
  if (url.pathname === '/state') {
    const tree = trees.get(commits.get(head).tree.sha) ?? [];
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ products, mail, issues, comments: Object.fromEntries(comments),
      files: tree.map(f => ({ path: f.path, content: blobs.get(f.sha) })), stripeChecks }));
    return;
  }
  res.writeHead(404); res.end();
});
control.listen(4328, '127.0.0.1');

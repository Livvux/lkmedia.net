# Grok Bot for WordPress: verification log

Page: `/en/grok-bot-wordpress` (`src/pages/en/grok-bot-wordpress.astro`).
All checks on 2026-11-16 against primary sources (docs fetched as `.md` from docs.x.ai, wordpress.org plugin API, developer.wordpress.org, make.wordpress.org, GitHub `WordPress/mcp-adapter`).
Re-check before every content update; Grok Bot and the WordPress AI building blocks change often.

Status: **verified** = stated by the primary source today. **not found** = searched in primary sources, no statement exists; the page says so instead of guessing. **dropped** = lead from the earlier research pass that is not on the page.

## Grok Bot (xAI / SpaceXSI)

| Claim on the page | Source | Checked | Status |
|---|---|---|---|
| Grok Bot is an agent with access to a cloud computer; Bots share a persistent cloud computer with browser, filesystem and terminal | https://docs.x.ai/grok-bot/overview | 2026-11-16 | verified |
| "Grok Bot supports custom tooling, so it can interact with any MCP or API"; connects to apps such as Slack, Notion, Drive | https://docs.x.ai/grok-bot/overview | 2026-11-16 | verified |
| `cursor.com/docs/grok-bot` redirects (308) to `docs.x.ai/grok-bot/overview` | curl -I | 2026-11-16 | verified (not on page) |
| Custom connector: "Add a custom connector" → type Remote HTTPS (Server URL, optional HTTP headers, OAuth client ID) or Command; team MCP policy can block it; a Bot can add an MCP server by URL or command; private-network servers need approval | https://docs.x.ai/grok-bot/computer-and-apps | 2026-11-16 | verified |
| OAuth tokens of connected apps are held on Cursor's connector backend; apps are account-wide | https://docs.x.ai/grok-bot/computer-and-apps | 2026-11-16 | verified |
| Auto Review checks actions; most run on their own; approval cards with Allow once / Always allow / Deny; Auto Review is model-based and should complement least privilege; approval does not reverse completed work | https://docs.x.ai/grok-bot/approvals-security-and-privacy | 2026-11-16 | verified |
| xAI recommends explicit boundaries for publishing content, deleting data, production changes; start with read-only tasks and drafts | https://docs.x.ai/grok-bot/approvals-security-and-privacy | 2026-11-16 | verified |
| Grok Bot uses Cursor accounts and Cursor data settings; Legacy Privacy Mode not supported; retention and deletion follow Cursor terms | https://docs.x.ai/grok-bot/approvals-security-and-privacy, https://docs.x.ai/grok-bot/faq | 2026-11-16 | verified |
| Plans: included with Premium, Super, Ultra on The X Subscription; legacy paid Cursor plans; linkable SuperGrok / SuperGrok Plus / SuperGrok Heavy / X Premium+; self-serve Grok Business seats. Page only says "included in certain X, Grok and Cursor plans" and links the docs | https://docs.x.ai/grok-bot/get-started, https://docs.x.ai/grok-bot/faq | 2026-11-16 | verified (page deliberately vague) |
| No model picker; requests may go to a first-party SpaceXSI model or a third-party model on Cursor's sub-processor list | https://docs.x.ai/grok-bot/faq, https://docs.x.ai/grok-bot/security | 2026-11-16 | verified |
| Grok Bot computers run in the United States; US-only residency program via Cursor account team; deletion under Cursor's DPA | https://docs.x.ai/grok-bot/security | 2026-11-16 | verified |
| Vendor naming: docs title "SpaceXSI (xAI)"; domain x.ai | https://docs.x.ai/llms.txt | 2026-11-16 | verified |
| GDPR statement for Grok Bot | docs.x.ai/grok-bot/* (overview, approvals, security, security-faq, faq) grep "GDPR" | 2026-11-16 | not found |
| A WordPress or WooCommerce integration documented by xAI for Grok Bot | grep "wordpress" / "woocommerce" over docs.x.ai/llms.txt index and downloaded pages overview, get-started, computer-and-apps, approvals, security, security-faq, faq: 0 matches | 2026-11-16 | not found |
| x.ai/bot/marketplace lists WordPress | https://x.ai/bot/marketplace (JS-rendered shell, no "WordPress" in HTML) | 2026-11-16 | inconclusive; not used on page |
| Grok Bot can be used in chat, voice, Slack and X; uses apps and sites without a connector via its cloud computer/browser | https://docs.x.ai/grok-bot/overview | 2026-11-16 | verified |
| Secrets: do not send API keys in chat; secure secret card and Vault keep values from the model | https://docs.x.ai/grok-bot/approvals-security-and-privacy | 2026-11-16 | verified |
| Grok Bot docs refer to Cursor Privacy Policy and Cursor Data Processing Agreement (https://cursor.com/terms/dpa) | https://docs.x.ai/grok-bot/approvals-security-and-privacy, https://docs.x.ai/grok-bot/security | 2026-11-16 | verified; contents of Cursor DPA not reviewed (page says so) |
| cursor.com/marketplace lists a third-party "WordPress" entry (miniOrange MCP gateway) | https://cursor.com/marketplace | 2026-11-16 | found, but described as connecting "to Cursor"; availability in Grok Bot unverified → dropped |
| "Since August 2026" launch date | – | 2026-11-16 | dropped (no primary source checked) |
| Prices for plans | – | – | dropped |

## xAI API

| Claim on the page | Source | Checked | Status |
|---|---|---|---|
| API base URL `https://api.x.ai/v1`; examples use the OpenAI SDK with that base URL | https://docs.x.ai/developers/quickstart | 2026-11-16 | verified |
| xAI API billed per token (per-token rates on model pages / pricing page; exact prices not on our page) | https://docs.x.ai/developers/advanced-api-usage/regions ("current per-token rates are on each model's detail page … and on the Pricing page") | 2026-11-16 | verified |
| Function calling: you define tools, the model returns a tool call, your code executes it | https://docs.x.ai/developers/tools/function-calling | 2026-11-16 | verified |
| Structured outputs via `response_format` with `json_schema`; schema adherence guaranteed for supported schema features | https://docs.x.ai/developers/model-capabilities/text/structured-outputs | 2026-11-16 | verified |
| API requests/responses stored 30 days (encrypted) for abuse auditing, not used for training without explicit permission; Zero Data Retention as team setting | https://docs.x.ai/developers/faq/security | 2026-11-16 | verified |
| SOC 2 Type 2 stated; the FAQ headline asks about GDPR but the answer contains no GDPR statement | https://docs.x.ai/developers/faq/security | 2026-11-16 | verified |
| Global endpoint does not guarantee a processing region; only a US regional endpoint (`us.api.x.ai`) is documented; not a full residency guarantee | https://docs.x.ai/developers/advanced-api-usage/regions | 2026-11-16 | verified |
| EU endpoint | docs.x.ai llms.txt index, regions page | 2026-11-16 | not found |
| xAI API DPA | docs.x.ai/developers/faq/security (refers to Trust Center under NDA) | 2026-11-16 | not found publicly → page advises asking xAI |
| `docs.x.ai/developers/data-retention.md`, `/developers/regions.md`, `/developers/introduction.md` | – | 2026-11-16 | 404 (wrong guessed paths; correct pages above) |
| Model IDs, rate limits, server-side tool pricing | – | – | dropped |
| xAI crawler user agent / robots.txt | – | – | dropped (not researched as primary source) |

## WordPress

| Claim on the page | Source | Checked | Status |
|---|---|---|---|
| No plugin by xAI found: directory searches for "grok" (255 results), "xai" (164), "x.ai" (72), first 60 each, filtered for grok/xai in slug/name/author → only third-party authors (Aslam Doctor, Khokan Sardar, Zactonz Technologies, videowhisper). Page words it as "our searches … returned only third-party authors" | https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=xai | 2026-11-16 | not found (search-based, not exhaustive) |
| MCP Adapter, author WordPress.org, part of "AI Building Blocks for WordPress"; bridges Abilities API to MCP; HTTP and STDIO transports; requires WordPress 6.9 | https://wordpress.org/plugins/mcp-adapter/ | 2026-11-16 | verified |
| MCP Adapter exposes only abilities marked public; permission checks run as the current user; it adds no AI features itself | https://wordpress.org/plugins/mcp-adapter/ (FAQ) | 2026-11-16 | verified |
| Endpoint `/wp-json/mcp/mcp-adapter-default-server`; auth with WordPress username + Application Password as `Authorization: Basic`; Application Passwords need HTTPS; use a separate low-role user; web apps that only support OAuth cannot connect without an OAuth plugin | https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md | 2026-11-16 | verified |
| AI Engine plugin lists a built-in xAI (Grok) connector, chatbot, MCP server | https://wordpress.org/plugins/ai-engine/ | 2026-11-16 | verified; its MCP section names Claude and ChatGPT, not Grok Bot (page does not claim Grok Bot support) |
| "AI Provider for Grok" (aslams-ai-provider-for-grok) and "AI Provider for xAI" (ai-provider-for-xai): third-party providers for the WordPress AI Client, plugin headers require WP 6.9 (AI Client itself ships in 7.0; page states both) | https://wordpress.org/plugins/aslams-ai-provider-for-grok/, https://wordpress.org/plugins/ai-provider-for-xai/ | 2026-11-16 | verified |
| WordPress 7.0 AI Client is provider-agnostic; core bundles no provider; official provider plugins: Anthropic, Google, OpenAI | https://make.wordpress.org/core/2026/03/24/introducing-the-ai-client-in-wordpress-7-0/ | 2026-11-16 | verified |
| WordPress 7.0 Settings → Connectors with three featured connectors (Anthropic, Google, OpenAI) | https://make.wordpress.org/core/2026/03/18/introducing-the-connectors-api-in-wordpress-7-0/ | 2026-11-16 | verified |
| REST: `POST /wp/v2/posts`; `status` one of publish, future, draft, pending, private; fields title, content | https://developer.wordpress.org/rest-api/reference/posts/ | 2026-11-16 | verified |
| Application Passwords since 5.6, generated under Users → Edit User, sent via Basic Auth over https | https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/ | 2026-11-16 | verified |
| Contributor role: can write and manage own posts but cannot publish; no `upload_files` | https://wordpress.org/documentation/article/roles-and-capabilities/ | 2026-11-16 | verified |
| WooCommerce has its own REST API built on the WordPress REST API | https://developer.woocommerce.com/docs/apis/rest-api/ | 2026-11-16 | verified |
| WordPress trademarks owned by the WordPress Foundation | https://wordpressfoundation.org/trademark-policy/ | 2026-11-16 | verified |
| Install counts, version numbers of plugins | wordpress.org plugin API | 2026-11-16 | verified but not published (go stale) |

## Softened on the page

- Route A (Grok Bot + MCP Adapter): both halves documented, the pairing is not documented by xAI or WordPress and was not tested by us. Page labels it "Custom setup and testing" and says a Contributor-only connection "should" keep publishing with editors, tested per site.
- "Official Grok plugin": stated as result of our directory searches, not as an absolute.

## Dropped leads from the earlier research pass

- cursor.com/marketplace third-party "WordPress" entry (miniOrange MCP gateway): says "to Cursor", Grok Bot availability unverified.

- Competitor tools (novamira.ai, notfair.co, xcloud.host, postiz, albato): not re-verified, not on the page.
- Plan prices from press coverage.
- Abilities API details from secondary sources (page only states what the MCP Adapter plugin page and guide say).

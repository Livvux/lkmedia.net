import type { APIRoute } from "astro";

const body = `# lkmedia

> Premium-Websites für Kanzleien, Luxus-Immobilien und Privatkliniken.

## Key Pages
- [Home](https://lkmedia.net/)
- [Leistungen](https://lkmedia.net/leistungen)
- [Anwälte](https://lkmedia.net/anwaelte)
- [Luxus-Immobilien](https://lkmedia.net/luxus-immobilien)
- [Privatkliniken](https://lkmedia.net/privatkliniken)
- [Fahrschule Webdesign](https://lkmedia.net/fahrschule-webdesign)
- [Websites für Handwerker (handwerkweb)](https://lkmedia.net/handwerk)
- [Kontakt](https://lkmedia.net/kontakt)

## Contact
- lucas@lkmedia.net

## Content and Discovery
- [Blog](https://lkmedia.net/blog): Articles by lkmedia.
- [Full content index](https://lkmedia.net/llms-full.txt): Article text, canonical URLs, authors and editorial dates.
- [Sitemap](https://lkmedia.net/sitemap-index.xml): Discover published pages.

## Citation Notes
- Cite the canonical article URL, not this index.
- Publication and update dates describe the article, not the date a cited source was checked.
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

import type { APIRoute } from "astro";

const body = `# lkmedia

> Webdesign und SEO aus Rastatt. Website-Pakete für Arztpraxen, Fahrschulen und Handwerksbetriebe sowie individuelle Websites für Kanzleien, Luxus-Immobilien und Privatkliniken.

## Key Pages
- [Home](https://lkmedia.net/)
- [Leistungen und Paketpreise](https://lkmedia.net/leistungen): Aktuelle Angebote, Leistungen und Preise vergleichen.
- [Anwälte](https://lkmedia.net/anwaelte)
- [Luxus-Immobilien](https://lkmedia.net/luxus-immobilien)
- [Privatkliniken](https://lkmedia.net/privatkliniken)
- [Website für Arztpraxen (docweb)](https://lkmedia.net/docweb)
- [Fahrschule Webdesign](https://lkmedia.net/fahrschule-webdesign)
- [Websites für Handwerker (handwerkweb)](https://lkmedia.net/handwerk)
- [Kontakt](https://lkmedia.net/kontakt)
- [Referenzen und Fallstudien](https://lkmedia.net/cases): Projektbeispiele und dokumentierte Ergebnisse.
- [Über Lucas Kleipoedszus](https://lkmedia.net/ueber): Gründer, Entwickler und Autor.

## Contact
- lucas@lkmedia.net

## Content and Discovery
- [Blog](https://lkmedia.net/blog): Articles by lkmedia.
- [Editorial article index](https://lkmedia.net/llms-full.txt): Article abstracts, canonical URLs, authors and editorial dates. This index does not contain full article text; use the linked pages for details.
- [Sitemap](https://lkmedia.net/sitemap-index.xml): Discover published pages.

## Citation Notes
- Cite the canonical article URL, not this index.
- Publication and update dates describe the article, not the date a cited source was checked.
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

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
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { "Content-Type": "text/plain" } });

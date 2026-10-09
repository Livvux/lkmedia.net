import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// Astro verliert Backslashes in statischen Attributen (pattern="\d{5}" kommt als "d{5}" an).
it('keine Backslashes in statischen Attributen von .astro-Seiten', () => {
  const files = readdirSync('src/pages', { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.astro'));
  const hits = files.flatMap((f) =>
    (readFileSync(join('src/pages', f), 'utf8').match(/\s[\w-]+="[^"{}]*\\[^"]*"/g) ?? []).map((m) => `${f}:${m.trim()}`),
  );
  expect(hits).toEqual([]);
});

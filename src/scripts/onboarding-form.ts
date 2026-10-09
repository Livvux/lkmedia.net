// Onboarding-Formulare (docweb, handwerkweb, fahrschulweb): Angaben im Browser sichern,
// Bilder vor dem Absenden prüfen, Vorschaubilder zeigen, große Fotos verkleinern.
// Ohne JS funktioniert alles als normaler Upload; der Server prüft ohnehin erneut.

const TYPEN = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_GESAMT = 40 * 1024 * 1024;
const MAX_KANTE = 2560;
const SKIP = ["session_id", "website"];

type Saved = Record<string, string[]>;

function fields(form: HTMLFormElement) {
  return form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input[name], textarea[name], select[name]",
  );
}

// ponytail: nur dieses Gerät; serverseitig speichern, falls Kunden oft von anderen Geräten ändern.
function restore(form: HTMLFormElement, key: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as Saved | null;
    if (!saved) return;
    for (const el of fields(form)) {
      const values = saved[el.name];
      if (!values || SKIP.includes(el.name) || el.type === "file") continue;
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        el.checked = values.includes(el.value);
      } else {
        el.value = values[0] ?? "";
      }
    }
  } catch {
    localStorage.removeItem(key);
  }
}

function save(form: HTMLFormElement, key: string) {
  const data: Saved = {};
  for (const el of fields(form)) {
    if (SKIP.includes(el.name) || el.type === "file") continue;
    // Ohne Auswahl fehlt der Name im FormData – leere Liste speichern, sonst kommen Vorauswahlen zurück.
    data[el.name] ??= [];
  }
  const fd = new FormData(form);
  for (const name of Object.keys(data)) data[name] = fd.getAll(name).map(String);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Speicher voll oder gesperrt: Absenden geht trotzdem.
  }
}

const fileInputs = (form: HTMLFormElement) => [
  ...form.querySelectorAll<HTMLInputElement>("input[type=file][name]"),
];

/** Erste Fehlermeldung für ein Feld, sonst null. Texte wie in src/lib/uploads.ts. */
function check(input: HTMLInputElement, gesamt: number): string | null {
  const files = [...(input.files ?? [])];
  const max = Number(input.dataset.max ?? 1);
  if (files.length > max) return `Bitte höchstens ${max} Bilder auswählen.`;
  for (const f of files) {
    if (!TYPEN.includes(f.type)) {
      return `„${f.name}“ ist kein unterstütztes Bild. Möglich sind JPG, PNG, WebP und SVG.`;
    }
    if (f.size > MAX_BYTES) {
      return `„${f.name}“ ist größer als 8 MB. Bitte ein kleineres Bild wählen.`;
    }
  }
  if (gesamt > MAX_GESAMT && input.name === "fotos") {
    return "Die Bilder sind zusammen größer als 40 MB. Bitte weniger oder kleinere Bilder auswählen.";
  }
  return null;
}

function showError(input: HTMLInputElement, msg: string | null) {
  const box = document.getElementById(`${input.id}-fehler`);
  if (box) box.textContent = msg ?? "";
  if (msg) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

/** Prüft alle Dateifelder; liefert das erste fehlerhafte Feld. */
function checkAll(form: HTMLFormElement): HTMLInputElement | null {
  const inputs = fileInputs(form);
  const gesamt = inputs.flatMap((i) => [...(i.files ?? [])]).reduce((n, f) => n + f.size, 0);
  let first: HTMLInputElement | null = null;
  for (const input of inputs) {
    const msg = check(input, gesamt);
    showError(input, msg);
    if (msg) first ??= input;
  }
  return first;
}

const urls = new WeakMap<HTMLInputElement, string[]>();

function preview(input: HTMLInputElement) {
  for (const u of urls.get(input) ?? []) URL.revokeObjectURL(u);
  const list = document.getElementById(`${input.id}-vorschau`);
  if (!list) return;
  const neu: string[] = [];
  const items = [...(input.files ?? [])]
    .filter((f) => TYPEN.includes(f.type))
    .map((f) => {
      const url = URL.createObjectURL(f);
      neu.push(url);
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = url;
      img.alt = f.name;
      img.className =
        "h-20 w-20 rounded-lg object-cover border border-black/10 dark:border-white/15";
      li.append(img);
      return li;
    });
  urls.set(input, neu);
  list.replaceChildren(...items);
}

function hasAlpha(ctx: OffscreenCanvasRenderingContext2D): boolean {
  const px = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 255) return true;
  return false;
}

/** Verkleinert JPEG/PNG/WebP über 2560 px Kantenlänge; bei jedem Problem das Original. */
async function shrink(f: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return f;
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap !== "function") return f;
  try {
    const bmp = await createImageBitmap(f);
    const scale = MAX_KANTE / Math.max(bmp.width, bmp.height);
    if (scale >= 1) {
      bmp.close();
      return f;
    }
    const c = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("kein 2d-Kontext");
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    // JPEG kennt keine Transparenz – transparente PNG/WebP werden als PNG verkleinert.
    const type = f.type !== "image/jpeg" && hasAlpha(ctx) ? "image/png" : "image/jpeg";
    const blob = await c.convertToBlob(type === "image/jpeg" ? { type, quality: 0.85 } : { type });
    const base = f.name.replace(/\.[^.]*$/, "") || "bild";
    return new File([blob], `${base}.${type === "image/png" ? "png" : "jpg"}`, { type });
  } catch {
    return f;
  }
}

async function onFiles(input: HTMLInputElement) {
  const files = await Promise.all([...(input.files ?? [])].map(shrink));
  if (files.some((f, i) => f !== input.files?.[i])) {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
  }
  preview(input);
  const form = input.form;
  if (form) checkAll(form);
}

for (const form of document.querySelectorAll<HTMLFormElement>("form[data-onboarding]")) {
  const key = `${form.dataset.onboarding}:${form.dataset.session}`;
  restore(form, key);
  form.addEventListener("change", () => save(form, key));

  let pending: Promise<void> = Promise.resolve();
  let busy = 0;
  for (const input of fileInputs(form)) {
    input.addEventListener("change", () => {
      busy++;
      pending = onFiles(input).finally(() => busy--);
    });
  }

  form.addEventListener("submit", (e) => {
    save(form, key);
    if (busy) {
      // Verkleinerung läuft noch: danach erneut absenden.
      e.preventDefault();
      void pending.then(() => form.requestSubmit());
      return;
    }
    const bad = checkAll(form);
    if (bad) {
      e.preventDefault();
      bad.focus();
    }
  });
}

// Fehlermeldung vom Server (?fehler=) zuerst vorlesen lassen.
document.querySelector<HTMLElement>("[data-onboarding-fehler]")?.focus();

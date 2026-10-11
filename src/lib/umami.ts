// LK Media's verified website entry in the existing self-hosted Umami account.
export const UMAMI_WEBSITE_ID = "f88c7448-64e5-4ca8-a31b-afaf1a079e2c";
export const UMAMI_SCRIPT_URL = "https://rpcrate.com/_sr/s.js";

const PRODUCTION_HOSTS = new Set(["lkmedia.net", "www.lkmedia.net"]);
const PRIVATE_PATH =
  /\/(?:api|admin|auth|account|login|signin|checkout|purchase|reset|password|passwort|onboarding|danke|thanks|aenderung|link|token|session)(?:\/|$)/i;
const PRIVATE_PARAMETER =
  /^(?:session(?:_?id)?|token|access(?:_?token)?|refresh_?token|id_?token|code|state|key|email|order(?:_?id)?|customer(?:_?id)?|password|reset|auth|next)$/i;

export function validUmamiWebsiteId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** The canonical comes from this rendered public page's trusted source, not the request URL. */
export function publicUmamiPath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//") || /[?#\\\s]/.test(value)) return null;
  try {
    if (PRIVATE_PATH.test(decodeURIComponent(value))) return null;
  } catch {
    return null;
  }
  return value.replace(/\/+$/, "") || "/";
}

interface PrivacySignals {
  doNotTrack?: string | null;
  msDoNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

export function umamiPageAllowed(
  websiteId: string,
  expectedPath: string,
  url: URL,
  privacy: PrivacySignals,
  legacyDoNotTrack?: string | number | null,
): boolean {
  const path = publicUmamiPath(expectedPath);
  const dnt = [legacyDoNotTrack, privacy.doNotTrack, privacy.msDoNotTrack];
  return (
    validUmamiWebsiteId(websiteId) &&
    url.protocol === "https:" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    PRODUCTION_HOSTS.has(url.hostname.toLowerCase()) &&
    path !== null &&
    publicUmamiPath(url.pathname) === path &&
    ![...url.searchParams.keys()].some((name) => PRIVATE_PARAMETER.test(name)) &&
    ![...new URLSearchParams(url.hash.slice(1)).keys()].some((name) =>
      PRIVATE_PARAMETER.test(name),
    ) &&
    !dnt.some((value) => value === 1 || value === "1" || value === "yes") &&
    privacy.globalPrivacyControl !== true
  );
}

interface UmamiPayload {
  website: string;
  hostname: string;
  url: string;
  title: string;
  referrer: string;
}

declare global {
  interface Window {
    umami?: { track: (payload: UmamiPayload) => Promise<void> };
  }
}

/** This Astro site uses full document navigation; each public document sends once. */
export function startUmami(websiteId: string, expectedPath: string): void {
  const allowed = () =>
    umamiPageAllowed(
      websiteId,
      expectedPath,
      new URL(window.location.href),
      navigator as Navigator & PrivacySignals,
      (window as Window & { doNotTrack?: string | number }).doNotTrack,
    );
  if (!allowed() || document.getElementById("lkmedia-umami-script")) return;

  let sent = false;
  const send = () => {
    if (sent || document.visibilityState !== "visible" || !allowed() || !window.umami) return;
    sent = true;
    document.removeEventListener("visibilitychange", send);
    void window.umami
      .track({
        website: websiteId,
        hostname: window.location.hostname,
        url: publicUmamiPath(expectedPath) ?? "/",
        title: document.title,
        referrer: "",
      })
      .catch(() => {});
  };

  const script = document.createElement("script");
  script.id = "lkmedia-umami-script";
  script.src = UMAMI_SCRIPT_URL;
  script.defer = true;
  script.referrerPolicy = "no-referrer";
  script.dataset.websiteId = websiteId;
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  script.dataset.excludeSearch = "true";
  script.dataset.excludeHash = "true";
  script.dataset.domains = [...PRODUCTION_HOSTS].join(",");
  script.addEventListener(
    "load",
    () => {
      document.addEventListener("visibilitychange", send);
      send();
    },
    { once: true },
  );
  document.head.append(script);
}

// Verlorenen Änderungs-Link per E-Mail neu zusenden – Antwort immer gleich (kein Adress-Abgleich nach außen).

import type { Registry } from "./kunden";
import type { Produkt } from "./kunden-schema";
import { linkMail } from "./kundenmails";
import type { OutgoingMail } from "./mailer";
import { aenderungUrl, type findSessionsByEmail } from "./stripe";

const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;

const PRODUKT_NAME: Record<Produkt, string> = {
  docweb: "Ihre Praxis-Website",
  handwerkweb: "Ihre Handwerker-Website",
  fahrschulweb: "Ihre Fahrschul-Website",
};

export const LINK_GESENDET =
  "Wenn diese Adresse bei uns bestellt hat, ist der Link jetzt unterwegs. Bitte schauen Sie auch im Spam-Ordner nach.";
const LIMIT_FEHLER =
  "Das waren zu viele Anfragen. Bitte versuchen Sie es in einer Stunde noch einmal oder schreiben Sie an lucas@lkmedia.net.";
const EMAIL_FEHLER =
  "Bitte geben Sie eine gültige E-Mail-Adresse ein, zum Beispiel name@beispiel.de.";

export type LinkRecoveryDeps = {
  stripeKey?: string;
  find: typeof findSessionsByEmail;
  registry: Pick<Registry, "bySession">;
  send: (m: OutgoingMail) => Promise<void>;
  allow: (key: string) => boolean;
  /** Limit je Zieladresse (3/Stunde), damit IP-Wechsel keine Mail-Flut auslösen. */
  allowMail: (key: string) => boolean;
};

const errName = (e: unknown) => (e instanceof Error ? e.name : "unknown");

export async function handleLinkRecovery(
  form: FormData,
  ip: string,
  deps: LinkRecoveryDeps,
): Promise<{ status: 200 | 400; fehler?: string; email: string }> {
  const raw = form.get("email");
  const email = typeof raw === "string" ? raw.trim() : "";
  if (!EMAIL.test(email) || email.length > 254) return { status: 400, fehler: EMAIL_FEHLER, email };
  if (!deps.allow(`link:${ip}`)) return { status: 400, fehler: LIMIT_FEHLER, email };
  // Limit je Adresse erreicht: still überspringen, Antwort bleibt gleich.
  if (!deps.allowMail(`link-mail:${email.toLowerCase()}`)) return { status: 200, email };
  try {
    if (!deps.stripeKey) throw new Error("STRIPE_SECRET_KEY fehlt");
    const treffer = await deps.find(email, deps.stripeKey);
    if (treffer.length) {
      const links = await Promise.all(
        treffer.map(async (s) => ({
          produkt: s.produkt,
          name: (await deps.registry.bySession(s.id))?.name ?? PRODUKT_NAME[s.produkt],
          url: aenderungUrl(s.id),
        })),
      );
      await deps.send({ to: email, ...linkMail({ links }), attachments: [] });
    }
  } catch (e) {
    console.error(`[link-recovery] failed: ${errName(e)}`);
  }
  return { status: 200, email };
}

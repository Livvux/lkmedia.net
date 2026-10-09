// Mails an die Kundschaft: je ein Hauptlink (aenderungUrl), Sie-Form, einfache Sprache.
import type { Produkt } from "./kunden-schema";
import { aenderungUrl, STRIPE_PORTAL_URL } from "./stripe";

type Mail = { subject: string; text: string };

const WEBSITE: Record<Produkt, string> = {
  docweb: "docweb-Website",
  handwerkweb: "handwerkweb-Website",
  fahrschulweb: "Fahrschul-Website",
};

const ANREDE = "Guten Tag,";
const GRUSS = "Viele Grüße\nLucas Kleipödszus\nlkmedia";
const portal = () =>
  STRIPE_PORTAL_URL
    ? [
        `Rechnungen, Zahlungsart und Kündigung finden Sie im Kundenportal von Stripe:\n${STRIPE_PORTAL_URL}`,
      ]
    : [];
const mail = (subject: string, absaetze: string[]): Mail => ({
  subject,
  text: [ANREDE, ...absaetze, ...portal(), GRUSS].join("\n\n"),
});

export function onboardingBestaetigung(o: {
  produkt: Produkt;
  name: string;
  sessionId: string;
  deliveryPromise: string;
  neu: boolean;
}): Mail {
  const link = `Über Ihren persönlichen Link können Sie Angaben ändern, weitere Bilder nachreichen und sehen, wie weit wir sind. Bitte bewahren Sie diesen Link gut auf:\n${aenderungUrl(o.sessionId)}`;
  return o.neu
    ? mail(`Ihre ${WEBSITE[o.produkt]}: Angaben erhalten`, [
        `vielen Dank – wir haben Ihre Angaben für ${o.name} erhalten.`,
        o.deliveryPromise,
        link,
      ])
    : mail(`Ihre ${WEBSITE[o.produkt]}: neuer Stand erhalten`, [
        `vielen Dank – wir haben den neuen Stand Ihrer Angaben für ${o.name} erhalten und arbeiten damit weiter.`,
        link,
      ]);
}

export function aenderungBestaetigung(o: { name: string; vorgang: number; sessionId: string }) {
  return mail(`Ihr Änderungsauftrag Nr. ${o.vorgang} ist angekommen`, [
    `vielen Dank – wir haben Ihren Änderungsauftrag für ${o.name} erhalten (Vorgang Nr. ${o.vorgang}). Wir melden uns, sobald die Änderung online ist oder wir eine Rückfrage haben.`,
    `Den Stand sehen Sie jederzeit über Ihren persönlichen Link:\n${aenderungUrl(o.sessionId)}`,
  ]);
}

export function linkMail(o: { links: { produkt: Produkt; name: string; url: string }[] }) {
  const liste = o.links.map((l) => `${l.name} (${WEBSITE[l.produkt]}):\n${l.url}`).join("\n\n");
  return mail("Ihr persönlicher Link für Ihre Website", [
    o.links.length === 1
      ? "hier ist Ihr persönlicher Link. Darüber können Sie Änderungen schicken, Bilder nachreichen und den Stand Ihrer Aufträge sehen:"
      : "hier sind Ihre persönlichen Links. Darüber können Sie Änderungen schicken, Bilder nachreichen und den Stand Ihrer Aufträge sehen:",
    liste,
    "Falls Sie diesen Link nicht angefordert haben, können Sie diese Mail einfach ignorieren.",
  ]);
}

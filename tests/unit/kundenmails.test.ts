import { describe, expect, it } from "vitest";
import {
  AENDERUNG_ZEITRAHMEN,
  aenderungBestaetigung,
  linkMail,
  onboardingBestaetigung,
} from "../../src/lib/kundenmails";
import { aenderungUrl, STRIPE_PORTAL_URL } from "../../src/lib/stripe";

const SID = "cs_test_mail123";
const GRUSS = "Viele Grüße\nLucas Kleipödszus\nlkmedia";

describe("kundenmails", () => {
  it("Onboarding-Mail: Anrede, Änderungslink, Lieferzusage, kein Logo per Mail", () => {
    const m = onboardingBestaetigung({
      produkt: "fahrschulweb",
      name: "Fahrschule Muster",
      sessionId: SID,
      deliveryPromise: "Vorschau in 7 Werktagen.",
      neu: true,
    });
    expect(m.subject).toBe("Ihre Fahrschul-Website: Angaben erhalten");
    expect(m.text.startsWith("Guten Tag,\n\n")).toBe(true);
    expect(m.text).toContain(aenderungUrl(SID));
    expect(m.text).toContain("Vorschau in 7 Werktagen.");
    expect(m.text).toContain("Bilder");
    expect(m.text).not.toMatch(/antworten Sie auf diese Mail/i);
    expect(m.text.endsWith(GRUSS)).toBe(true);
    expect(m.text).toContain(STRIPE_PORTAL_URL);
  });

  it("Onboarding-Mail für neuen Stand", () => {
    const m = onboardingBestaetigung({
      produkt: "docweb",
      name: "Praxis X",
      sessionId: SID,
      deliveryPromise: "Vorschau.",
      neu: false,
    });
    expect(m.subject).toBe("Ihre docweb-Website: neuer Stand erhalten");
    expect(m.text).toContain(aenderungUrl(SID));
  });

  it("Änderungs-Mail nennt Vorgang und Link", () => {
    const m = aenderungBestaetigung({ name: "Betrieb Y", vorgang: 42, sessionId: SID });
    expect(m.subject).toContain("42");
    expect(m.text.startsWith("Guten Tag,\n\n")).toBe(true);
    expect(m.text).toContain(aenderungUrl(SID));
    expect(m.text.endsWith(GRUSS)).toBe(true);
    expect(m.text).toContain(STRIPE_PORTAL_URL);
    expect(AENDERUNG_ZEITRAHMEN).toBe("in der Regel innerhalb von 2 Werktagen");
    expect(m.text).toContain(`Wir kümmern uns ${AENDERUNG_ZEITRAHMEN} darum`);
  });

  it("Link-Mail listet alle Links", () => {
    const m = linkMail({
      links: [
        { produkt: "docweb", name: "Praxis X", url: aenderungUrl("cs_test_a") },
        { produkt: "handwerkweb", name: "Betrieb Y", url: aenderungUrl("cs_test_b") },
      ],
    });
    expect(m.text).toContain(aenderungUrl("cs_test_a"));
    expect(m.text).toContain(aenderungUrl("cs_test_b"));
    expect(m.text).toContain("Praxis X");
    expect(m.text.endsWith(GRUSS)).toBe(true);
  });

  it("aenderungUrl kodiert die Session", () => {
    expect(aenderungUrl("a&b")).toBe("https://lkmedia.net/aenderung?session_id=a%26b");
  });
});

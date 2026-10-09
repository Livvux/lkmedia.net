import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "../../src/lib/site-submit";
import { handleLinkRecovery, type LinkRecoveryDeps } from "../../src/lib/link-recovery";
import type { OutgoingMail } from "../../src/lib/mailer";
import { findSessionsByEmail, PAYMENT_LINKS } from "../../src/lib/stripe";

const MAIL = "kunde@example.test";
function fd(email: string) {
  const f = new FormData();
  f.set("email", email);
  return f;
}

function setup(find: LinkRecoveryDeps["find"]) {
  const sent: OutgoingMail[] = [];
  const deps: LinkRecoveryDeps = {
    stripeKey: "sk_test",
    find,
    registry: { bySession: async (s) => (s === "cs_test_a" ? ({ name: "Fahrschule Test" } as never) : undefined) },
    send: async (m) => void sent.push(m),
    allow: createRateLimiter(3, 3_600_000),
    allowMail: createRateLimiter(3, 3_600_000),
  };
  return { deps, sent };
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe("handleLinkRecovery", () => {
  it("mails all links to the entered address", async () => {
    const { deps, sent } = setup(async () => [
      { id: "cs_test_a", produkt: "fahrschulweb" },
      { id: "cs_test_b", produkt: "docweb" },
    ]);
    expect(await handleLinkRecovery(fd(` ${MAIL} `), "1.1.1.1", deps)).toEqual({ status: 200, email: MAIL });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(MAIL);
    expect(sent[0].text).toContain("session_id=cs_test_a");
    expect(sent[0].text).toContain("session_id=cs_test_b");
    expect(sent[0].text).toContain("Fahrschule Test");
    expect(sent[0].text).toContain("Ihre Praxis-Website");
  });

  it("sends nothing without a match and answers the same", async () => {
    const { deps, sent } = setup(async () => []);
    expect(await handleLinkRecovery(fd(MAIL), "1.1.1.1", deps)).toEqual({ status: 200, email: MAIL });
    expect(sent).toHaveLength(0);
  });

  it("blocks the 4th attempt per IP", async () => {
    const { deps } = setup(async () => []);
    for (let i = 0; i < 3; i++) await handleLinkRecovery(fd(MAIL), "2.2.2.2", deps);
    const r = await handleLinkRecovery(fd(MAIL), "2.2.2.2", deps);
    expect(r.status).toBe(400);
    expect(r.fehler).toContain("lucas@lkmedia.net");
    expect((await handleLinkRecovery(fd(MAIL), "3.3.3.3", deps)).status).toBe(200);
  });

  it("answers the same on Stripe failure and logs without the address", async () => {
    const { deps, sent } = setup(async () => {
      throw new Error(`Stripe 500 ${MAIL}`);
    });
    expect(await handleLinkRecovery(fd(MAIL), "1.1.1.1", deps)).toEqual({ status: 200, email: MAIL });
    expect(sent).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith("[link-recovery] failed: Error");
  });

  it("rejects an invalid address with the value kept", async () => {
    const { deps } = setup(async () => []);
    const r = await handleLinkRecovery(fd("kein-mail"), "1.1.1.1", deps);
    expect(r).toMatchObject({ status: 400, email: "kein-mail" });
    expect(r.fehler).toBeTruthy();
  });
});

describe("per-address limit", () => {
  it("sends at most 3 mails per address across IPs with identical responses", async () => {
    const { deps, sent } = setup(async () => [{ id: "cs_test_a", produkt: "fahrschulweb" }]);
    const rs = [];
    for (const ip of ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4"])
      rs.push(await handleLinkRecovery(fd("Kunde@Example.test"), ip, deps));
    expect(sent).toHaveLength(3);
    expect(rs.map((r) => ({ status: r.status, fehler: r.fehler }))).toEqual(
      Array(4).fill({ status: 200, fehler: undefined }),
    );
  });
});

describe("findSessionsByEmail", () => {
  const sess = (email: string, id = "cs_test_1") => ({
    id,
    payment_status: "paid",
    payment_link: PAYMENT_LINKS.fahrschulweb,
    customer_details: { email },
  });
  const stripe = (data: object[]) =>
    vi.fn(async () => new Response(JSON.stringify({ data }))) as unknown as typeof fetch;

  it("drops sessions whose buyer email differs", async () => {
    expect(await findSessionsByEmail(MAIL, "sk", stripe([sess("anderer@example.test")]))).toEqual([]);
  });

  it("matches the buyer email case-insensitively", async () => {
    expect(await findSessionsByEmail(" kunde@example.test ", "sk", stripe([sess("Kunde@Example.test")]))).toEqual([
      { id: "cs_test_1", produkt: "fahrschulweb" },
    ]);
  });

  it("queries by customer_details[email] and keeps only paid sessions of our payment links", async () => {
    const f = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: "cs_test_1", payment_status: "paid", payment_link: PAYMENT_LINKS.fahrschulweb, customer_details: { email: MAIL } },
              { id: "cs_test_2", payment_status: "unpaid", payment_link: PAYMENT_LINKS.fahrschulweb, customer_details: { email: MAIL } },
              { id: "cs_test_3", payment_status: "paid", payment_link: "plink_fremd", customer_details: { email: MAIL } },
            ],
          }),
        ),
    );
    const r = await findSessionsByEmail(MAIL, "sk", f as unknown as typeof fetch);
    expect(r).toEqual([{ id: "cs_test_1", produkt: "fahrschulweb" }]);
    const url = decodeURIComponent((f.mock.calls[0] as unknown as [string])[0]);
    expect(url).toContain(`customer_details[email]=${MAIL}`);
    expect(url).toContain("status=complete");
  });

  it("throws on Stripe errors", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 500 }));
    await expect(findSessionsByEmail(MAIL, "sk", f as unknown as typeof fetch)).rejects.toThrow();
  });
});

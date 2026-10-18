import { afterEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

async function submit(key = "runtime-key", headers: Record<string, string> = {}, discovery = "unknown") {
  vi.stubEnv("RESEND_API_KEY", key);
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  const { POST } = await import("../../src/pages/api/contact");
  const form = new FormData();
  form.set("discovery", discovery);
  for (const [k, v] of Object.entries({ name: "Test Person", email: "test@example.test", message: "Private message", "cf-turnstile-response": "token" })) form.set(k, v);
  return POST({ request: new Request("http://internal:4321/api/contact", { method: "POST", headers, body: form }), clientAddress: "10.0.0.1" } as Parameters<typeof POST>[0]);
}

describe("contact", () => {
  it("sends with runtime configuration and redirects directly to German thanks", async () => {
    send.mockResolvedValue({ error: null });
    const r = await submit("runtime-key", { "accept-language": "en" });
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("/danke");
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ replyTo: "test@example.test" }));
  });
  it("reports missing configuration without logging personal data", async () => {
    const log = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await submit("")).status).toBe(503);
    expect(log.mock.calls).toEqual([["[contact] RESEND_API_KEY unset"]]);
  });
  it.each(["returned", "thrown"])("reports %s provider errors without exposing them", async (mode) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const success = vi.spyOn(console, "info").mockImplementation(() => {});
    if (mode === "returned") send.mockResolvedValue({ error: { message: "Private message" } });
    else send.mockRejectedValue(new Error("Private message"));
    expect((await submit()).status).toBe(503);
    expect(log.mock.calls).toEqual([["[contact] Versand fehlgeschlagen"]]);
    expect(success).not.toHaveBeenCalled();
  });
  it.each([
    ["chatgpt", "ChatGPT", "chatgpt"],
    ["https://private.example?email=PRIVATE", "Keine Angabe", "unknown"],
    ["__proto__", "Keine Angabe", "unknown"],
  ])("retains only allowed self-reported channels: %s", async (input, label, channel) => {
    send.mockResolvedValue({ error: null });
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect((await submit("runtime-key", {}, input)).status).toBe(303);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining(`Herkunft (Selbstauskunft): ${label}`) }));
    expect(log.mock.calls).toEqual([[`[seo] lead_received source=/kontakt discovery=${channel}`]]);
  });
  it("uses the visitor IP for Turnstile", async () => {
    vi.stubEnv("RESEND_API_KEY", "runtime-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "turnstile-runtime-key");
    send.mockResolvedValue({ error: null });
    const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchFn);
    const { POST } = await import("../../src/pages/api/contact");
    const body = new URLSearchParams({ name: "Test", email: "test@example.test", message: "Hello", "cf-turnstile-response": "token" });
    const r = await POST({ request: new Request("https://lkmedia.net/api/contact", { method: "POST", headers: { "cf-connecting-ip": "203.0.113.1" }, body }), clientAddress: "10.0.0.1" } as Parameters<typeof POST>[0]);
    expect(r.status).toBe(303);
    expect(fetchFn.mock.calls[0]?.[1]?.body).toBeInstanceOf(URLSearchParams);
    expect(String(fetchFn.mock.calls[0]?.[1]?.body)).toContain("remoteip=203.0.113.1");
  });
});

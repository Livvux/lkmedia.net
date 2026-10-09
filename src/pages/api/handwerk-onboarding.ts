import type { APIRoute } from "astro";
import { createGitHub } from "../../lib/github";
import { createRateLimiter } from "../../lib/handwerk-submit";
import { checkSession, HANDWERKWEB, parseOnboarding, toKundeYaml } from "../../lib/handwerkweb";
import { sendMail } from "../../lib/mailer";
import { handleOnboarding, toResponse } from "../../lib/onboarding-submit";

export const prerender = false;

const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
// ponytail: In-Memory-Sperre gegen Doppelklick (1 pro Session/60 s); nach Neustart leer.
const allow = createRateLimiter(1, 60_000);

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Ungültige Anfrage.", { status: 400 });
  }
  const token = env("GITHUB_KUNDEN_TOKEN");
  const r = await handleOnboarding(
    { produkt: "handwerkweb", form },
    {
      stripeKey: env("STRIPE_SECRET_KEY"),
      checkSession,
      parse: parseOnboarding,
      toYaml: toKundeYaml,
      name: (d) => d.betrieb.name,
      replyTo: (d) => d.betrieb.email,
      gh: token ? createGitHub({ token }) : null,
      send: sendMail,
      allow,
      release: allow.release,
      now: () => new Date(),
      deliveryPromise: HANDWERKWEB.deliveryPromise,
      danke: "/handwerk/danke",
      onboardingPfad: "/handwerk/onboarding",
    },
  );
  return toResponse(r);
};

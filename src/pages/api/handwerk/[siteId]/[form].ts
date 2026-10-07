import type { APIRoute } from "astro";
import { createRateLimiter, handleSubmission } from "../../../../lib/handwerk-submit";
import { sendMail } from "../../../../lib/mailer";

export const prerender = false;

const allow = createRateLimiter(5, 10 * 60 * 1000);

/** Hinter Traefik: der letzte X-Forwarded-For-Eintrag stammt vom Proxy selbst, nicht vom Client. */
function clientIp(request: Request, fallback: string): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",").at(-1)?.trim() || fallback;
}

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  const r = await handleSubmission(
    {
      siteId: params.siteId ?? "",
      form: params.form ?? "",
      origin: request.headers.get("origin"),
      ip: clientIp(request, clientAddress),
      contentLength: Number(request.headers.get("content-length") ?? 0),
      formData: () => request.formData(),
    },
    { send: sendMail, allow, dev: import.meta.env.DEV },
  );
  if (r.status === 303)
    return new Response(null, { status: 303, headers: { Location: r.location } });
  return new Response(r.body, { status: r.status });
};

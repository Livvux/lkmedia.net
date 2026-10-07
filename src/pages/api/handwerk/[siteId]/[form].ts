import type { APIRoute } from "astro";
import { clientIp } from "../../../../lib/client-ip";
import { createRateLimiter, handleSubmission } from "../../../../lib/handwerk-submit";
import { sendMail } from "../../../../lib/mailer";

export const prerender = false;

const allow = createRateLimiter(5, 10 * 60 * 1000);

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

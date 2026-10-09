// SMTP-Versand (AWS SES Mail Manager) für handwerkweb. Zugangsdaten nur aus der Umgebung.
import nodemailer, { type Transporter } from "nodemailer";
import type { MailContent } from "./mail-types";

export interface OutgoingMail extends MailContent {
  to: string;
}

const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
let transport: Transporter | undefined;

export async function sendMail(m: OutgoingMail): Promise<void> {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  if (!host || !user || !pass) throw new Error("SMTP nicht konfiguriert (SMTP_HOST/USER/PASS)");
  const port = Number(env("SMTP_PORT") ?? 587);
  const secure = port === 465;
  transport ??= nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
  });
  await transport.sendMail({
    from: env("SMTP_FROM") ?? "lkmedia.net <no-reply@lkmedia.net>",
    to: m.to,
    replyTo: m.replyTo,
    subject: m.subject,
    text: m.text,
    attachments: m.attachments,
  });
}

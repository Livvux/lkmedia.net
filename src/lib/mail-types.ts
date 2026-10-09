// Gemeinsame Mail-/Formular-Typen für alle Produkte (Handwerk, Fahrschule, Onboarding).
export interface Attachment {
  filename: string;
  contentType: string;
  content: Buffer;
}
export interface MailContent {
  subject: string;
  text: string;
  replyTo?: string;
  attachments: Attachment[];
}
export type Grund = "pflichtfelder" | "plz" | "email" | "auswahl" | "dateien" | "alter";
export type FormResult = { ok: true; mail: MailContent } | { ok: false; grund: Grund };

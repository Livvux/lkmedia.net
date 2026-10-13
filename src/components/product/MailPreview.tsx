import { Camera, Paperclip } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Beispieldaten (keine echten Anfragen): so sieht die Mail im Postfach des Betriebs aus.
const MAILS = {
  anfrage: {
    label: "Projektanfrage",
    subject: "Neue Projektanfrage: Wärmepumpe tauschen – 76437 Rastatt",
    rows: [
      ["Anliegen", "Heizung erneuern / Wärmepumpe"],
      ["Ort", "76437 Rastatt · liegt in Ihrem Einsatzgebiet"],
      ["Objektart", "Einfamilienhaus, Baujahr 1994"],
      ["Zeitrahmen", "in den nächsten 3 Monaten"],
      [
        "Beschreibung",
        "Ölheizung, 18 Jahre alt. Möchte wissen, was ein Umstieg kostet und ob Förderung möglich ist.",
      ],
    ],
    attach: "3 Fotos angehängt",
    icon: Camera,
  },
  bewerbung: {
    label: "Bewerbung",
    subject: "Neue Bewerbung: Anlagenmechaniker SHK (m/w/d)",
    rows: [
      ["Stelle", "Anlagenmechaniker SHK (m/w/d), Vollzeit"],
      ["Name", "Max Beispiel"],
      ["Telefon", "0151 000 000 00 · am besten abends"],
      ["Erfahrung", "6 Jahre, Heizung und Bad, Führerschein B"],
      ["Nachricht", "Suche einen Betrieb mit festem Team und Wärmepumpen-Projekten."],
    ],
    attach: "Lebenslauf optional",
    icon: Paperclip,
  },
} as const;

export default function MailPreview() {
  return (
    <Tabs defaultValue="anfrage" className="w-full gap-4">
      <TabsList className="h-11 self-start">
        {Object.entries(MAILS).map(([key, m]) => (
          <TabsTrigger key={key} value={key} className="h-9 px-4 text-sm">
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(MAILS).map(([key, m]) => (
        <TabsContent key={key} value={key} className="m-0">
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
            <header className="border-b border-border bg-secondary px-5 py-4">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                  Beispiel-Mail
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-medium text-foreground">{m.subject}</h3>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Von: Ihre Website · An: info@ihr-betrieb.de
              </p>
            </header>
            <dl className="divide-y divide-border px-5">
              {m.rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 text-sm sm:grid-cols-[110px_1fr] sm:gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <footer className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-tone">
              <m.icon className="size-4" aria-hidden="true" />
              {m.attach}
              <span className="ml-auto hidden text-muted-foreground sm:inline">
                Direkt auf die Mail antworten
              </span>
            </footer>
          </article>
        </TabsContent>
      ))}
    </Tabs>
  );
}

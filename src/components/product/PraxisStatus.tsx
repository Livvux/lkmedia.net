import { CalendarCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Beispiel-Praxis. Zeigt die Logik der echten Anzeige „Jetzt geöffnet“ (Feiertage + Urlaub → „Heute geschlossen“).
const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;
const HOURS: Record<number, [number, number] | null> = {
  0: null,
  1: [8, 17],
  2: [8, 17],
  3: [8, 17],
  4: [8, 17],
  5: [8, 13],
  6: null,
};
const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

interface Status {
  open: boolean;
  headline: string;
  detail: string;
}

function statusAt(now: Date, holiday: boolean): Status {
  if (holiday)
    return { open: false, headline: "Heute geschlossen", detail: "Feiertag in Ihrem Bundesland" };
  const today = HOURS[now.getDay()];
  const h = now.getHours() + now.getMinutes() / 60;
  if (today && h >= today[0] && h < today[1])
    return { open: true, headline: "Jetzt geöffnet", detail: `bis ${pad(today[1])} Uhr` };
  for (let i = 0; i < 7; i++) {
    const day = (now.getDay() + i) % 7;
    const slot = HOURS[day];
    if (!slot || (i === 0 && h >= slot[0])) continue;
    const when = i === 0 ? "heute" : i === 1 ? "morgen" : DAYS[day];
    return {
      open: false,
      headline: "Jetzt geschlossen",
      detail: `öffnet ${when} um ${pad(slot[0])} Uhr`,
    };
  }
  return { open: false, headline: "Jetzt geschlossen", detail: "" };
}

export default function PraxisStatus() {
  const switchId = useId();
  const [holiday, setHoliday] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [note, setNote] = useState(false);

  // Erst nach dem Mount: Serverseitig steht keine Uhrzeit fest, sonst gäbe es einen Hydration-Konflikt.
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const status = now ? statusAt(now, holiday) : null;

  return (
    <div className="w-full max-w-[320px] rounded-3xl border border-border bg-[#0c0c0e] p-5 text-left shadow-2xl shadow-black/60">
      <p className="font-mono text-[11px] text-muted-foreground">Beispiel-Praxis</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">Praxis Dr. Beispiel</p>
      <p className="text-sm text-muted-foreground">Allgemeinmedizin · Rastatt</p>

      <div className="mt-4 rounded-2xl bg-secondary p-4" aria-live="polite">
        <div className="flex items-center gap-2.5">
          <span
            className={`size-2.5 rounded-full ${status ? (status.open ? "bg-[var(--ok)]" : "bg-[var(--warn)]") : "bg-white/25"} ${status?.open ? "pulse-dot" : ""}`}
            aria-hidden="true"
          />
          <span className="font-medium">{status ? status.headline : "Öffnungszeiten"}</span>
        </div>
        <p className="mt-1 pl-5 text-sm text-muted-foreground">
          {status ? status.detail : "Beispielanzeige"}
        </p>
      </div>

      <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
        Mo–Do 08:00–17:00 · Fr 08:00–13:00
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <label htmlFor={switchId} className="text-sm text-muted-foreground">
          Feiertag simulieren
        </label>
        <Switch id={switchId} checked={holiday} onCheckedChange={setHoliday} />
      </div>

      <Button
        type="button"
        onClick={() => setNote((v) => !v)}
        aria-expanded={note}
        className="mt-4 h-11 w-full rounded-full bg-tone text-tone-foreground hover:bg-tone/90"
      >
        <CalendarCheck aria-hidden="true" /> Termin buchen
      </Button>
      {note && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Bei Ihrer Praxis öffnet dieser Knopf den Kalender bei Doctolib, samedi oder Ihrem Dienst.
          Hier ist es nur ein Beispiel.
        </p>
      )}
    </div>
  );
}

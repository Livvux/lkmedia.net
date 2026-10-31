import { FileText, UserPlus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

// Beispiel-Einträge, keine echten Kunden: zeigen, welche Angaben in der Mail ankommen.
const ITEMS = [
  {
    kind: "anfrage",
    title: "Neue Projektanfrage",
    line: "Wärmepumpe tauschen · 76437 Rastatt",
    meta: "Einfamilienhaus · in 3 Monaten · 3 Fotos",
  },
  {
    kind: "bewerbung",
    title: "Neue Bewerbung",
    line: "Anlagenmechaniker SHK (m/w/d)",
    meta: "6 Jahre Erfahrung · ohne Lebenslauf",
  },
  {
    kind: "anfrage",
    title: "Neue Projektanfrage",
    line: "Wallbox + PV-Anlage · 76530 Baden-Baden",
    meta: "Neubau · so bald wie möglich · 2 Fotos",
  },
  {
    kind: "anfrage",
    title: "Neue Projektanfrage",
    line: "Badsanierung · 76593 Gernsbach",
    meta: "Reihenhaus · in 6 Monaten · 5 Fotos",
  },
] as const;

const VISIBLE = 3;

export default function InboxDemo() {
  const [tick, setTick] = useState(VISIBLE - 1);
  const reduce = useReducedMotion();

  // Neuester Eintrag oben; Schlüssel = Position in ITEMS, damit motion die Karten wiedererkennt.
  const shown = Array.from({ length: VISIBLE }, (_, i) => {
    const n = tick - i;
    return { n, item: ITEMS[((n % ITEMS.length) + ITEMS.length) % ITEMS.length] };
  });

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-[#0c0c0e]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-2 pb-3 pt-1 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-tone" aria-hidden="true" />
          Posteingang · Beispiel
        </span>
        <span>info@ihr-betrieb.de</span>
      </div>
      <ul
        className="flex flex-col gap-2"
        aria-label="Beispiele eingehender Anfragen und Bewerbungen"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map(({ n, item }) => (
            <motion.li
              key={n}
              layout
              initial={reduce ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={reduce ? { duration: 0 } : { duration: 0.22 }}
              className="flex gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tone/15 text-tone">
                {item.kind === "bewerbung" ? (
                  <UserPlus className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[13px] font-medium text-foreground">{item.title}</span>
                <span className="block truncate text-[13px] text-foreground/90">{item.line}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <button
        type="button"
        onClick={() => setTick((value) => value + 1)}
        className="mt-2 min-h-11 w-full rounded-lg text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Nächstes Beispiel <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

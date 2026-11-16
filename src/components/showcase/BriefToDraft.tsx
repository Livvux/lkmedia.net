import { useEffect, useRef, useState } from "react";
import {
  type Brief,
  buildDraft,
  defaultBrief,
  type Lang,
  LIMITS,
  META_MAX,
  TONES,
  type Tone,
} from "./brief-to-draft";

type Phase = "idle" | "running" | "review" | "approved";
type Props = { lang: Lang };

const STEP_MS = 400;
const SECTIONS = 5;

const COPY = {
  de: {
    sim: "Simulation · keine echte KI, es werden keine Daten gesendet",
    brief: "Content-Brief",
    topic: "Thema",
    audience: "Zielgruppe",
    tone: "Ton",
    points: "Kernpunkte",
    point: (n: number) => `Kernpunkt ${n}`,
    generate: "Entwurf erzeugen",
    reset: "Zurücksetzen",
    stages: ["Eingang", "In Arbeit", "Prüfung durch Mensch"],
    example: "Beispielentwurf",
    draft: "Entwurf",
    meta: "Meta-Beschreibung",
    outline: "Gliederung",
    intro: "Einleitung",
    questions: "Vor Veröffentlichung prüfen",
    chars: "Zeichen",
    approve: "Freigeben",
    revise: "Überarbeiten",
    pill: "Entwurf · wartet auf Redaktion",
    approvedNote:
      "In einem echten Projekt landet der Text als Entwurf in WordPress. Veröffentlicht wird er von einem Menschen.",
  },
  en: {
    sim: "Simulation · no real AI, no data is sent",
    brief: "Content brief",
    topic: "Topic",
    audience: "Audience",
    tone: "Tone",
    points: "Key points",
    point: (n: number) => `Key point ${n}`,
    generate: "Generate draft",
    reset: "Reset",
    stages: ["Received", "In progress", "Human review"],
    example: "Example draft",
    draft: "Draft",
    meta: "Meta description",
    outline: "Outline",
    intro: "Introduction",
    questions: "Check before publishing",
    chars: "characters",
    approve: "Approve",
    revise: "Revise",
    pill: "Draft · awaiting editor",
    approvedNote:
      "In a real project, the text lands in WordPress as a draft. A person publishes it.",
  },
} as const;

const field =
  "min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg)] px-3 text-[15px] text-[var(--fg)] outline-none focus-visible:border-[var(--signal)]";
const label = "font-mono text-[11px] uppercase tracking-wider text-[var(--fg-muted)]";
const btn =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors";

export default function BriefToDraft({ lang }: Props) {
  const t = COPY[lang];
  const [brief, setBrief] = useState<Brief>(() => defaultBrief(lang));
  const [draft, setDraft] = useState(() => buildDraft(defaultBrief(lang), lang));
  const [phase, setPhase] = useState<Phase>("idle");
  // Server-Render und erster Client-Render zeigen den vollständigen Beispielentwurf.
  const [shown, setShown] = useState(SECTIONS);
  const [stage, setStage] = useState(-1);
  const [example, setExample] = useState(true);
  const [reduce, setReduce] = useState(false);
  const timers = useRef<number[]>([]);
  const tracked = useRef(new Set<string>());
  const root = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const reviseButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current.length = 0;
  };
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of pending) window.clearTimeout(id);
    };
  }, []);

  // umami.ts kennt nur feste Event-Namen; der Lead verdrahtet dieses DOM-Event.
  const track = (action: "generate" | "approve") => {
    if (tracked.current.has(action)) return;
    tracked.current.add(action);
    root.current?.dispatchEvent(
      new CustomEvent("lkmedia:demo", { bubbles: true, detail: { action } }),
    );
  };

  const generate = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearTimers();
    track("generate");
    setDraft(buildDraft(brief, lang));
    setExample(false);
    if (reduce) {
      setShown(SECTIONS);
      setStage(2);
      setPhase("review");
      return;
    }
    setPhase("running");
    setShown(0);
    setStage(0);
    for (let i = 1; i <= SECTIONS; i++) {
      timers.current.push(
        window.setTimeout(() => {
          setStage(1);
          setShown(i);
        }, i * STEP_MS),
      );
    }
    timers.current.push(
      window.setTimeout(
        () => {
          setStage(2);
          setPhase("review");
        },
        (SECTIONS + 1) * STEP_MS,
      ),
    );
  };

  const revise = () => {
    clearTimers();
    setPhase("idle");
    setStage(-1);
    firstField.current?.focus();
  };

  const reset = () => {
    clearTimers();
    setBrief(defaultBrief(lang));
    setDraft(buildDraft(defaultBrief(lang), lang));
    setExample(true);
    setPhase("idle");
    setShown(SECTIONS);
    setStage(-1);
  };

  const setPoint = (i: number, value: string) =>
    setBrief((b) => {
      const points: Brief["points"] = [...b.points];
      points[i] = value;
      return { ...b, points };
    });

  const reveal = (i: number) =>
    `transition-[opacity,transform,visibility] duration-[420ms] ease-[var(--ease-out)] ${
      i < shown ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2"
    }`;

  return (
    <div
      ref={root}
      className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--fg)]"
    >
      <p className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--fg)] sm:px-5">
        <span className="size-1.5 shrink-0 rounded-full bg-[var(--signal)]" aria-hidden="true" />
        {t.sim}
      </p>

      <div className="grid min-[900px]:grid-cols-2">
        <form
          onSubmit={generate}
          className="grid content-start gap-4 border-b border-[var(--border)] p-4 sm:p-5 min-[900px]:border-r min-[900px]:border-b-0"
        >
          <h3 className="text-base font-medium">{t.brief}</h3>
          <label className="grid gap-1.5">
            <span className={label}>{t.topic}</span>
            <input
              ref={firstField}
              className={field}
              value={brief.topic}
              maxLength={LIMITS.topic}
              onChange={(e) => setBrief({ ...brief, topic: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            <span className={label}>{t.audience}</span>
            <input
              className={field}
              value={brief.audience}
              maxLength={LIMITS.audience}
              onChange={(e) => setBrief({ ...brief, audience: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            <span className={label}>{t.tone}</span>
            <select
              className={field}
              value={brief.tone}
              onChange={(e) => setBrief({ ...brief, tone: e.target.value as Tone })}
            >
              {TONES[lang].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-2">
            <legend className={`${label} mb-1.5`}>{t.points}</legend>
            {brief.points.map((p, i) => (
              <input
                // biome-ignore lint/suspicious/noArrayIndexKey: feste drei Felder
                key={i}
                aria-label={t.point(i + 1)}
                className={field}
                value={p}
                maxLength={LIMITS.point}
                onChange={(e) => setPoint(i, e.target.value)}
              />
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={phase === "running"}
              className={`${btn} bg-[var(--signal)] text-[var(--signal-ink)] hover:opacity-90 disabled:opacity-60`}
            >
              {t.generate}
            </button>
            <button
              type="button"
              onClick={reset}
              className={`${btn} border border-[var(--border-strong)] hover:border-[var(--fg-muted)]`}
            >
              {t.reset}
            </button>
          </div>
        </form>

        <div className="grid content-start gap-4 p-4 sm:p-5">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
            {t.stages.map((s, i) => (
              <li
                key={s}
                aria-current={i === stage ? "step" : undefined}
                className={`flex items-center gap-2 ${
                  i === stage
                    ? "font-semibold text-[var(--signal)]"
                    : i < stage
                      ? "text-[var(--fg)]"
                      : "text-[var(--fg-muted)]"
                }`}
              >
                {i > 0 && (
                  <span aria-hidden="true" className="text-[var(--fg-muted)]">
                    →
                  </span>
                )}
                {s}
              </li>
            ))}
          </ol>

          <div aria-live="polite" className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={label}>{example ? t.example : t.draft}</span>
              {phase === "approved" && (
                <span className="rounded-full border border-[var(--signal)] bg-[var(--signal-dim)] px-3 py-1 font-mono text-[11px] text-[var(--fg)]">
                  {t.pill}
                </span>
              )}
            </div>

            <h4 className={`text-xl font-medium leading-snug tracking-tight ${reveal(0)}`}>
              {draft.h1}
            </h4>

            <div className={`grid gap-1 ${reveal(1)}`}>
              <span className={label}>
                {t.meta} · {draft.meta.length} / {META_MAX} {t.chars}
              </span>
              <p className="text-sm leading-relaxed text-[var(--fg-muted)]">{draft.meta}</p>
            </div>

            <div className={`grid gap-1.5 ${reveal(2)}`}>
              <span className={label}>{t.outline}</span>
              <ol className="grid gap-1 text-sm">
                {draft.outline.map((h, i) => (
                  <li key={h + String(i)} className="flex gap-2">
                    <span className="font-mono text-[var(--fg-muted)]">H2</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`grid gap-1 ${reveal(3)}`}>
              <span className={label}>{t.intro}</span>
              <p className="text-sm leading-relaxed">{draft.intro}</p>
            </div>

            <div
              className={`grid gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 ${reveal(4)}`}
            >
              <span className={label}>{t.questions}</span>
              <ul className="grid list-disc gap-1 pl-5 text-sm text-[var(--fg-muted)]">
                {draft.questions.map((q, i) => (
                  <li key={q + String(i)}>{q}</li>
                ))}
              </ul>
            </div>

            {phase === "approved" && (
              <p className="text-sm text-[var(--fg-muted)]">{t.approvedNote}</p>
            )}
          </div>

          {(phase === "review" || phase === "approved") && (
            <div className="flex flex-wrap gap-2">
              {phase === "review" && (
                <button
                  type="button"
                  onClick={() => {
                    track("approve");
                    setPhase("approved");
                    reviseButton.current?.focus();
                  }}
                  className={`${btn} bg-[var(--fg)] text-[var(--bg)] hover:opacity-90`}
                >
                  {t.approve}
                </button>
              )}
              <button
                ref={reviseButton}
                type="button"
                onClick={revise}
                className={`${btn} border border-[var(--border-strong)] hover:border-[var(--fg-muted)]`}
              >
                {t.revise}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

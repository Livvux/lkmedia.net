import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Dauer des Hochzählens in Millisekunden. */
  duration?: number;
  className?: string;
};

const format = (value: number) => new Intl.NumberFormat("de-DE").format(value);

/**
 * Counter (react-bits "Counter"): zählt beim Sichtbarwerden hoch.
 * Server-seitig steht der Endwert im HTML – ohne JavaScript bleibt die Zahl korrekt.
 */
export default function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 1500,
  className = "",
}: Props) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let start = 0;

    const tick = (now: number) => {
      frame = 0;
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setDisplay(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}

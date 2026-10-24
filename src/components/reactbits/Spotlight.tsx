import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** RGB-Werte des Lichtflecks, z. B. "120, 150, 255". */
  color?: string;
  /** Radius des Lichtflecks in Pixeln. */
  size?: number;
  /** Deckkraft der Fläche (0–1). */
  intensity?: number;
  /** Leuchten des Kartenrandes (0–1). */
  borderGlow?: number;
  style?: CSSProperties;
};

/**
 * Spotlight (react-bits "SpotlightCard"): ein weicher Lichtfleck folgt dem Zeiger.
 * Rein dekorativ. Ohne JavaScript bleibt die Karte unverändert lesbar.
 */
export default function Spotlight({
  children,
  className = "",
  color = "120, 150, 255",
  size = 340,
  intensity = 0.16,
  borderGlow = 0.45,
  style,
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let inside = false;
    let frame = 0;

    const paint = () => {
      frame = 0;
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      el.style.setProperty("--spot-x", `${x.toFixed(1)}px`);
      el.style.setProperty("--spot-y", `${y.toFixed(1)}px`);
      el.style.setProperty("--spot-opacity", inside ? "1" : "0");
      if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        frame = requestAnimationFrame(paint);
      }
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      targetX = event.clientX - rect.left;
      targetY = event.clientY - rect.top;
      inside = true;
      wake();
    };

    const onLeave = () => {
      inside = false;
      wake();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={root}
      className={`rb-spotlight ${className}`.trim()}
      style={
        {
          "--spot-color": color,
          "--spot-size": `${size}px`,
          "--spot-intensity": intensity,
          "--spot-border": borderGlow,
          ...style,
        } as CSSProperties
      }
    >
      <span className="rb-spotlight__light" aria-hidden="true" />
      {children}
      <span className="rb-spotlight__border" aria-hidden="true" />
    </div>
  );
}

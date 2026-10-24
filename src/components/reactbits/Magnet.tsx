import { type ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  /** Wie stark das Element zum Zeiger zieht (0–1). */
  strength?: number;
  /** Abstand in Pixeln, in dem das Element noch reagiert. */
  radius?: number;
  className?: string;
  innerClassName?: string;
};

/**
 * Magnet (react-bits "Magnet"): Buttons ziehen den Zeiger leicht an.
 * Touch-Geräte und reduzierte Bewegung werden ignoriert.
 */
export default function Magnet({
  children,
  strength = 0.32,
  radius = 90,
  className = "",
  innerClassName = "",
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const target = inner.current;
    if (!el || !target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const paint = () => {
      frame = 0;
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      target.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) {
        frame = requestAnimationFrame(paint);
      }
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const reach = Math.hypot(rect.width, rect.height) / 2 + radius;
      if (distance > reach) {
        tx = 0;
        ty = 0;
        wake();
        return;
      }
      const falloff = 1 - Math.min(1, distance / reach);
      tx = dx * strength * falloff;
      ty = dy * strength * falloff;
      wake();
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      wake();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [radius, strength]);

  return (
    <div ref={root} className={`rb-magnet ${className}`.trim()}>
      <div ref={inner} className={`rb-magnet__inner ${innerClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}

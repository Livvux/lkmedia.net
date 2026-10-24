import { type ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  /** Maximaler Neigungswinkel in Grad. */
  maxTilt?: number;
  className?: string;
  innerClassName?: string;
};

/**
 * TiltedCard (react-bits "TiltedCard"): die Karte neigt sich leicht zum Zeiger.
 * Ohne JavaScript bleibt sie gerade – die Kippung ist reine Dekoration.
 */
export default function TiltedCard({
  children,
  maxTilt = 5,
  className = "",
  innerClassName = "",
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let rx = 0;
    let ry = 0;
    let tx = 0;
    let ty = 0;

    const paint = () => {
      frame = 0;
      rx += (tx - rx) * 0.14;
      ry += (ty - ry) * 0.14;
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) {
        frame = requestAnimationFrame(paint);
      }
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      tx = (0.5 - py) * maxTilt * 2;
      ty = (px - 0.5) * maxTilt * 2;
      el.style.setProperty("--tilt-x", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-y", `${(py * 100).toFixed(1)}%`);
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
  }, [maxTilt]);

  return (
    <div ref={root} className={`rb-tilt ${className}`.trim()}>
      <div className={`rb-tilt__inner ${innerClassName}`.trim()}>{children}</div>
      <span className="rb-tilt__glare" aria-hidden="true" />
    </div>
  );
}

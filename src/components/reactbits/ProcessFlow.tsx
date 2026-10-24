import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { type CSSProperties, useRef } from "react";

export type ProcessStep = {
  n: string;
  title: string;
  body: string;
};

type Props = {
  id: string;
  title: string;
  sub: string;
  steps: ProcessStep[];
};

/**
 * ProcessFlow: sticky Ablauf mit Fortschrittslinie, die beim Scrollen mitwächst.
 * Die Fortschrittslinie nutzt motion (react-bits "ScrollFloat"-Prinzip),
 * die Einblendung der Schritte läuft über das data-reveal des Layouts –
 * damit bleibt die Seite auch ohne JavaScript vollständig lesbar.
 */
export default function ProcessFlow({ id, title, sub, steps }: Props) {
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start 65%", "end 75%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <section ref={section} id={id} className="process" aria-labelledby={`${id}-title`}>
      <div className="wrap process__grid">
        <div className="process__aside">
          <div className="process__sticky">
            <span className="eyebrow">06 · Ablauf</span>
            <h2 id={`${id}-title`} className="section-title">
              {title}
            </h2>
            <p className="section-sub">{sub}</p>
            <div className="process__rail" aria-hidden="true">
              <motion.span
                className="process__rail-fill"
                style={reduce ? { scaleY: 1 } : { scaleY: progress }}
              />
            </div>
          </div>
        </div>

        <ol className="process__steps">
          {steps.map((step, i) => (
            <li
              key={step.n}
              className="process__step"
              data-reveal
              style={{ "--d": `${i * 80}ms` } as CSSProperties}
            >
              <span className="process__n" aria-hidden="true">
                {step.n}
              </span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

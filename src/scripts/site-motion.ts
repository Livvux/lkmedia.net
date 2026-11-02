import { animate, inView, scroll, stagger } from "motion";
import { splitWords } from "./split-words";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const ease = [0.22, 1, 0.36, 1] as const;
// React-Inseln nicht verändern (Hydration), Formulare in Ruhe lassen.
const SKIP = "astro-island, form";

type Keyframes = Record<string, string[]>;

function enhance(main: HTMLElement | null) {
  const cleanups: (() => void)[] = [];
  const animations: ReturnType<typeof animate>[] = [];
  // Was beim Laden schon sichtbar ist, bleibt unangetastet: kein Flackern, kein späterer LCP.
  const belowFold = (element: Element) => element.getBoundingClientRect().top > innerHeight;

  const reveal = (
    element: HTMLElement,
    keyframes: Keyframes,
    delay: number,
    trigger: Element = element,
  ) => {
    const entrance = animate(element, keyframes, { duration: 0.9, ease, delay, autoplay: false });
    // Motion schreibt den Endwert inline; entfernen, damit Hover-Transforms der Seite greifen.
    const clear = () => {
      for (const name of Object.keys(keyframes)) {
        element.style.removeProperty(name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
      }
    };
    entrance.then(clear);
    animations.push(entrance);
    cleanups.push(
      inView(
        trigger,
        () => {
          entrance.play();
        },
        { margin: "0px 0px -8% 0px" },
      ),
      clear,
    );
  };

  const footerName = document.querySelector<HTMLElement>(".footer-name");
  if (footerName) {
    const rise = animate(
      footerName,
      { transform: ["translateY(45%)", "translateY(0%)"], opacity: [0.15, 1] },
      { ease: "linear" },
    );
    animations.push(rise);
    cleanups.push(
      scroll(rise, {
        target: footerName.closest("footer") ?? footerName,
        offset: ["start end", "end end"],
      }),
    );
  }

  // Die Startseite hat ihre eigene Inszenierung in home-motion.ts.
  if (main && !main.querySelector(".home")) {
    for (const heading of main.querySelectorAll<HTMLElement>("h2:not(.sr-only)")) {
      if (heading.closest(SKIP) || !belowFold(heading)) continue;
      const { words, restore } = splitWords(heading);
      const entrance = animate(
        words,
        {
          transform: ["translateY(110%) rotate(3deg)", "translateY(0%) rotate(0deg)"],
          opacity: [0, 1],
        },
        { duration: 0.85, ease, delay: stagger(0.035), autoplay: false },
      );
      animations.push(entrance);
      cleanups.push(
        inView(
          heading,
          () => {
            entrance.play();
          },
          { margin: "0px 0px -6% 0px" },
        ),
        restore,
      );
    }

    // Karten und Listeneinträge steigen auf, versetzt nach Spalte. Artikeltexte bleiben ruhig.
    const units = new Map<HTMLElement, number>();
    const eligible = (element: Element) => !element.closest(`${SKIP}, article, .prose`);
    for (const list of main.querySelectorAll<HTMLElement>("ul, ol")) {
      if (!eligible(list) || list.children.length < 2) continue;
      const columns = getComputedStyle(list).gridTemplateColumns.split(" ").length || 1;
      [...list.children].forEach((item, index) => {
        if (item instanceof HTMLElement && !item.parentElement?.closest("li")) {
          units.set(item, index % columns);
        }
      });
    }
    const listItems = [...units.keys()];
    for (const grid of main.querySelectorAll<HTMLElement>("div, section")) {
      if (!eligible(grid) || grid.children.length < 2) continue;
      const style = getComputedStyle(grid);
      const columns = style.display.includes("grid")
        ? style.gridTemplateColumns.split(" ").length
        : 1;
      if (columns < 2) continue;
      [...grid.children].forEach((child, index) => {
        if (!(child instanceof HTMLElement) || units.has(child)) return;
        if (listItems.some((item) => child.contains(item) || item.contains(child))) return;
        units.set(child, index % columns);
      });
    }
    for (const [unit, column] of units) {
      const nested = [...units.keys()].some((other) => other !== unit && other.contains(unit));
      if (nested || !belowFold(unit)) continue;
      reveal(
        unit,
        { opacity: ["0", "1"], transform: ["translateY(48px)", "translateY(0px)"] },
        column * 0.08,
      );
    }

    for (const media of main.querySelectorAll<HTMLElement>("img, video")) {
      if (media.closest(SKIP) || media.offsetWidth < 240 || !belowFold(media)) continue;
      // Elternelement beobachten: Chrome zählt das clip-path des Ziels mit.
      reveal(
        media,
        { clipPath: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] },
        0.1,
        media.parentElement ?? media,
      );
    }

    const article = main.querySelector<HTMLElement>("article");
    if (article && article.offsetHeight > innerHeight * 2) {
      const bar = document.createElement("div");
      bar.className = "read-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.append(bar);
      const progress = animate(bar, { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" });
      animations.push(progress);
      cleanups.push(scroll(progress, { target: article, offset: ["start start", "end end"] }), () =>
        bar.remove(),
      );
    }
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
    for (const animation of animations) animation.cancel();
  };
}

let cleanup = () => {};
const update = () => {
  cleanup();
  cleanup = reducedMotion.matches ? () => {} : enhance(document.querySelector("main"));
};
update();
reducedMotion.addEventListener("change", update);

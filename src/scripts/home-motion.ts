import { animate, inView, scroll, stagger } from "motion";

const home = document.querySelector<HTMLElement>(".home");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const desktop = matchMedia("(min-width: 900px) and (min-height: 600px)");
const ease = [0.22, 1, 0.36, 1] as const;

function enhanceHome(root: HTMLElement) {
  const cleanups: (() => void)[] = [];
  const animations: ReturnType<typeof animate>[] = [];
  const headings = root.querySelectorAll<HTMLElement>("h2:not(.sr-only), .intro-statement, .lead");

  for (const heading of headings) {
    const original = heading.innerHTML;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent?.trim()) nodes.push(walker.currentNode as Text);
    }
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const word of (node.textContent ?? "").split(/(\s+)/)) {
        if (!word.trim()) {
          fragment.append(document.createTextNode(word));
          continue;
        }
        const mask = document.createElement("span");
        mask.className = "motion-word-mask";
        const inner = document.createElement("span");
        inner.className = "motion-word";
        inner.textContent = word;
        mask.append(inner);
        fragment.append(mask);
      }
      node.replaceWith(fragment);
    }
    const words = heading.querySelectorAll<HTMLElement>(".motion-word");
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
    );
    cleanups.push(() => {
      heading.innerHTML = original;
    });
  }

  const reveals = root.querySelectorAll<HTMLElement>(
    "[data-reveal], .hero-kicker, .hero-actions, .hero-bottom",
  );
  for (const element of reveals) {
    if (element.querySelector(".motion-word")) continue;
    const entrance = animate(
      element,
      { opacity: [0, 1], transform: ["translateY(42px)", "translateY(0px)"] },
      { duration: 0.8, ease, autoplay: false },
    );
    animations.push(entrance);
    if (element.closest(".hero")) {
      entrance.play();
      continue;
    }
    cleanups.push(
      inView(
        element,
        () => {
          entrance.play();
        },
        { margin: "0px 0px -5% 0px" },
      ),
    );
  }

  for (const frame of root.querySelectorAll<HTMLElement>("[data-motion-image]")) {
    const image = frame.querySelector<HTMLElement>("img, video");
    if (!image) continue;
    const parallax = animate(
      image,
      { transform: ["translateY(-4%) scale(1.12)", "translateY(4%) scale(1.12)"] },
      { ease: "linear" },
    );
    animations.push(parallax);
    cleanups.push(scroll(parallax, { target: frame, offset: ["start end", "end start"] }));
  }

  const statement = root.querySelector<HTMLElement>(".intro-statement");
  if (statement) {
    const words = statement.querySelectorAll<HTMLElement>(".motion-word-mask");
    for (let index = 0; index < words.length; index++) {
      const ink = animate(words[index], { opacity: [0.28, 1] }, { ease: "linear" });
      animations.push(ink);
      const start = 0.9 - (index / words.length) * 0.45;
      cleanups.push(
        scroll(ink, { target: statement, offset: [`start ${start}`, `start ${start - 0.2}`] }),
      );
    }
  }

  const watermark = root.querySelector<HTMLElement>(".final-watermark");
  if (watermark) {
    const drift = animate(
      watermark,
      { transform: ["translateX(-8%)", "translateX(4%)"] },
      { ease: "linear" },
    );
    animations.push(drift);
    cleanups.push(
      scroll(drift, {
        target: watermark.parentElement ?? watermark,
        offset: ["start end", "end start"],
      }),
    );
  }

  let stopScene = () => {};
  const setupScene = () => {
    stopScene();
    const scene = root.querySelector<HTMLElement>("[data-hero-scene]");
    if (!scene || !desktop.matches) return;
    const stops: (() => void)[] = [];
    const sceneAnimations: ReturnType<typeof animate>[] = [];
    scene.classList.add("is-motion");
    const directions = [
      [
        "translate(40%, 45%) scale(0.55) rotate(-8deg)",
        "translate(-85%, -90%) scale(1.3) rotate(-14deg)",
      ],
      [
        "translate(-35%, 40%) scale(0.6) rotate(6deg)",
        "translate(90%, -80%) scale(1.4) rotate(12deg)",
      ],
      [
        "translate(40%, -40%) scale(0.6) rotate(5deg)",
        "translate(-65%, 90%) scale(1.35) rotate(-8deg)",
      ],
      [
        "translate(-35%, -40%) scale(0.55) rotate(-5deg)",
        "translate(80%, 85%) scale(1.4) rotate(10deg)",
      ],
    ];
    scene.querySelectorAll<HTMLElement>("[data-hero-project]").forEach((project, index) => {
      const flight = animate(
        project,
        {
          transform: directions[index],
          opacity: [0, 1, 1, 0],
        },
        { ease: "linear", opacity: { times: [0, 0.18, 0.75, 1] } },
      );
      sceneAnimations.push(flight);
      stops.push(scroll(flight, { target: scene, offset: ["start start", "end end"] }));
    });
    stopScene = () => {
      for (const stop of stops) stop();
      for (const animation of sceneAnimations) animation.cancel();
      scene.classList.remove("is-motion");
    };
  };
  setupScene();
  desktop.addEventListener("change", setupScene);

  return () => {
    desktop.removeEventListener("change", setupScene);
    stopScene();
    for (const cleanup of cleanups) cleanup();
    for (const animation of animations) animation.cancel();
  };
}

if (home) {
  let cleanup = () => {};
  const update = () => {
    cleanup();
    if (!reducedMotion.matches) cleanup = enhanceHome(home);
  };
  update();
  reducedMotion.addEventListener("change", update);
}

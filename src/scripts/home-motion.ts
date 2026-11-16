// Startseite: Abschnitte unterhalb des ersten Bildschirms blenden beim Hereinscrollen kurz ein.
// Ohne JS oder mit reduzierter Bewegung bleibt alles sichtbar; das Hero-Schnittbild ist reines CSS.
const home = document.querySelector<HTMLElement>(".home");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

if (home && "IntersectionObserver" in window) {
  const items = [...home.querySelectorAll<HTMLElement>("[data-reveal]")];
  let observer: IntersectionObserver | undefined;

  const setup = () => {
    observer?.disconnect();
    for (const item of items) item.classList.remove("is-pending", "is-revealed");
    if (reducedMotion.matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.replace("is-pending", "is-revealed");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    observer = io;
    // Nur, was noch unter dem Bildschirm liegt; Sichtbares flackert nicht nachträglich.
    for (const item of items) {
      if (item.getBoundingClientRect().top < innerHeight) continue;
      item.classList.add("is-pending");
      io.observe(item);
    }
  };

  setup();
  reducedMotion.addEventListener("change", setup);
}

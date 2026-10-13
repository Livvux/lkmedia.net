import { BorderBeam } from "@/components/ui/border-beam";

// Eigene Insel, damit nur der Lichtstrahl Hydration braucht; die Preiskarte bleibt statisches HTML.
export default function BeamFrame() {
  return (
    <>
      <BorderBeam
        size={260}
        duration={10}
        borderWidth={1.5}
        colorFrom="var(--tone)"
        colorTo="oklch(1 0 0 / 0.55)"
      />
      <BorderBeam
        size={260}
        duration={10}
        delay={5}
        borderWidth={1.5}
        colorFrom="var(--tone)"
        colorTo="oklch(1 0 0 / 0.55)"
      />
    </>
  );
}

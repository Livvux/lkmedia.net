import { ArrowRight, PartyPopper } from "lucide-react";
import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

interface Item {
  title: string;
  body: string;
}

interface Props {
  items: Item[];
  ctaHref: string;
}

export default function PrepChecklist({ items, ctaHref }: Props) {
  const uid = useId();
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number, on: boolean) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
  const all = done.size === items.length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4" role="status" aria-live="polite">
        <Progress
          value={(done.size / items.length) * 100}
          className="h-2 flex-1 bg-secondary [&>div]:bg-tone"
        />
        <span className="shrink-0 font-mono text-sm text-muted-foreground">
          {done.size} von {items.length} bereit
        </span>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item, i) => {
          const id = `${uid}-${i}`;
          const on = done.has(i);
          return (
            <li key={item.title}>
              <label
                htmlFor={id}
                className={`flex h-full cursor-pointer gap-4 rounded-2xl border p-5 transition-colors md:p-6 ${
                  on
                    ? "border-tone/60 bg-tone/[0.07]"
                    : "border-border bg-card hover:border-white/20"
                }`}
              >
                <Checkbox
                  id={id}
                  checked={on}
                  onCheckedChange={(v) => toggle(i, v === true)}
                  className="mt-1 size-5 data-[state=checked]:border-tone data-[state=checked]:bg-tone data-[state=checked]:text-tone-foreground"
                />
                <span>
                  <span className="block text-lg font-semibold tracking-tight">{item.title}</span>
                  <span className="mt-2 block text-[15px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {all && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-tone/50 bg-tone/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 font-medium">
            <PartyPopper className="size-5 text-tone" aria-hidden="true" />
            Sie haben alles beisammen. Die Angaben tragen Sie nach dem Kauf in einem kurzen Formular
            ein.
          </p>
          <a
            href={ctaHref}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-tone px-5 text-sm font-medium text-tone-foreground"
          >
            Zum Paket <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}

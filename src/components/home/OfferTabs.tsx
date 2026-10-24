import { Tabs } from "@base-ui/react/tabs";
import { ArrowUpRight } from "lucide-react";
import type { HomeContent } from "@/lib/home-content";

type Props = { tabs: HomeContent["offers"]["tabs"] };

// Panels bleiben gemountet (keepMounted), damit Preise und Links auch im HTML ohne JS stehen.
export default function OfferTabs({ tabs }: Props) {
  return (
    <Tabs.Root defaultValue={tabs[0]?.value} className="mt-12">
      <Tabs.List className="relative z-0 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-white/[0.03] p-1 backdrop-blur-sm">
        {tabs.map((t) => (
          <Tabs.Tab
            key={t.value}
            value={t.value}
            className="h-9 whitespace-nowrap rounded-full px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active]:text-background"
          >
            {t.label}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator
          renderBeforeHydration
          className="absolute top-1/2 left-0 -z-10 h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-1/2 rounded-full bg-foreground transition-[translate,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />
      </Tabs.List>

      {tabs.map((t) => (
        <Tabs.Panel
          key={t.value}
          value={t.value}
          keepMounted
          className="mt-10 grid gap-10 outline-none data-[hidden]:hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            <p className="text-pretty text-[var(--fg-muted)] leading-relaxed">{t.lead}</p>
            <a className="mono-link mt-6" href={t.link.href}>
              {t.link.label} <span aria-hidden="true">→</span>
            </a>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
            {t.items.map((item, i) => (
              <li
                key={item.href + item.title}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <a
                  href={item.href}
                  data-spot
                  className="group flex h-full flex-col gap-3 bg-[var(--bg)] p-6 transition-colors hover:bg-[var(--bg-card)]"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="text-lg font-medium tracking-tight">{item.title}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[var(--fg-dim)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </span>
                  <span className="text-[15px] leading-relaxed text-[var(--fg-muted)]">
                    {item.body}
                  </span>
                  {item.price && (
                    <span className="mt-auto pt-2 font-mono text-xs text-[var(--fg-dim)]">
                      {item.price}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

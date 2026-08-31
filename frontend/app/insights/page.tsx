"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { insightCategories, insights } from "@/lib/site-data";
import { eyebrow, pill, pillActive, sectionPadTop } from "@/lib/ui";

const tones = ["warm", "sage", "cream", "portrait"] as const;

export default function InsightsPage() {
  const [active, setActive] = useState<(typeof insightCategories)[number]>("All");
  const filtered = active === "All" ? insights : insights.filter((a) => a.category === active);

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      <section className={`bg-cream ${sectionPadTop} pb-10`}>
        <Reveal>
          <p className={eyebrow}>INSIGHTS</p>
          <h1 className="m-0 font-serif text-[clamp(38px,4.6vw,58px)] font-medium leading-[1]">Insights for Your Journey</h1>
          <p className="mt-3 text-sm text-muted">Thoughts, tools and reflections to support your growth.</p>
        </Reveal>

        <div className="mt-8 flex flex-wrap gap-3">
          {insightCategories.map((cat) => (
            <button key={cat} onClick={() => setActive(cat)} className={active === cat ? pillActive : pill}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-[max(5vw,32px)] py-[60px] max-[700px]:px-6">
        <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
          {filtered.map((a, i) => (
            <Reveal key={a.slug}>
              <a href={`/insights/${a.slug}`} className="block">
                <PhotoBlock tone={tones[i % tones.length]} className="mb-4 h-[190px] w-full rounded-2xl" />
                <h3 className="mb-2 font-serif text-xl font-medium leading-tight">{a.title}</h3>
                <p className="mb-3 text-xs text-muted">{a.category}</p>
                <p className="text-[11px] text-[#8e775c]">
                  {a.date} · {a.readTime}
                </p>
              </a>
            </Reveal>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-sm text-muted">No articles in this category yet.</p>}
      </section>

      <SiteFooter />
    </main>
  );
}

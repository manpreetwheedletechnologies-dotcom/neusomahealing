"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { testimonialFilters, testimonialsFull } from "@/lib/site-data";
import { buttonDark, eyebrow, pill, pillActive, sectionPadTop } from "@/lib/ui";

export default function TestimonialsPage() {
  const [active, setActive] = useState<(typeof testimonialFilters)[number]>("All");
  const filtered = active === "All" ? testimonialsFull : testimonialsFull.filter((t) => t.category === active);

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      <section className={`bg-cream text-center ${sectionPadTop} pb-10`}>
        <Reveal>
          <p className={`${eyebrow} justify-center text-center`}>CLIENT EXPERIENCES</p>
          <h1 className="m-0 font-serif text-[clamp(38px,4.6vw,58px)] font-medium leading-[1]">Real Journeys. Real Transformation.</h1>
          <p className="mt-3 text-sm text-muted">Stories from beautiful souls who chose themselves.</p>
        </Reveal>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {testimonialFilters.map((cat) => (
            <button key={cat} onClick={() => setActive(cat)} className={active === cat ? pillActive : pill}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-[max(5vw,32px)] py-[60px] max-[700px]:px-6">
        <div className="grid grid-cols-3 gap-5 max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
          {filtered.map((t) => (
            <Reveal className="rounded-[18px] border border-[#dfd3c1] bg-[#fffaf3] p-7" key={t.name}>
              <p className="mb-6 text-sm leading-[1.7] text-ink">&ldquo;{t.quote}&rdquo;</p>
              <footer className="flex items-center gap-3 border-t border-[#e4d9ca] pt-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#b7c8b9] font-serif text-lg font-medium">
                  {t.name.charAt(0)}
                </div>
                <span>
                  <strong className="block text-xs">{t.name}</strong>
                  <small className="block text-[10px] text-[#8b7863]">{t.type}</small>
                </span>
              </footer>
            </Reveal>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-sm text-muted">No stories in this category yet.</p>}

        <div className="mt-12 text-center">
          <a className={buttonDark} href="/contact">
            Share Your Story
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

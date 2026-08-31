"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { VideoThumb } from "@/components/VideoThumb";
import { allVideos, videoCategories } from "@/lib/site-data";
import { buttonDark, eyebrow, pill, pillActive, sectionPadTop } from "@/lib/ui";

export default function VideosPage() {
  const [active, setActive] = useState<(typeof videoCategories)[number]>("All");
  const filtered = active === "All" ? allVideos : allVideos.filter((v) => v.category === active);

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      <section className={`bg-cream ${sectionPadTop} pb-10`}>
        <Reveal>
          <p className={eyebrow}>WATCH · REFLECT · DISCOVER</p>
          <h1 className="m-0 font-serif text-[clamp(38px,4.6vw,58px)] font-medium leading-[1]">Videos &amp; Resources</h1>
          <p className="mt-3 text-sm text-muted">Learn, reflect, grow.</p>
        </Reveal>

        <div className="mt-8 flex flex-wrap gap-3">
          {videoCategories.map((cat) => (
            <button key={cat} onClick={() => setActive(cat)} className={active === cat ? pillActive : pill}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-[max(5vw,32px)] py-[60px] max-[700px]:px-6">
        <div className="grid grid-cols-3 gap-[18px] max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
          {filtered.map((v) => (
            <Reveal key={v.title}>
              <VideoThumb title={v.title} duration={v.duration} category={v.category} />
            </Reveal>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-sm text-muted">No videos in this category yet.</p>}
      </section>

      <section className="flex items-center justify-between gap-8 bg-deep px-[max(5vw,32px)] py-[55px] text-white max-[700px]:block">
        <Reveal>
          <p className="font-serif text-2xl">Want support on your transformation journey?</p>
        </Reveal>
        <a className={`${buttonDark} border border-white/40 bg-transparent max-[700px]:mt-6`} href="/book-session">
          Book a Session <span>↗</span>
        </a>
      </section>

      <SiteFooter />
    </main>
  );
}

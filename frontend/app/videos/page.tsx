"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { apiRequest } from "@/lib/api";
import type { ApiVideo, ApiTestimonial } from "@/lib/site-content-api";
import { getPublicTestimonials } from "@/lib/site-content-api";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { buttonDark, eyebrow, pill, pillActive, sectionPadTop } from "@/lib/ui";

function VideoPreviewCard({
  title,
  video,
  onOpen,
}: {
  title: string;
  video: string;
  onOpen: () => void;
}) {
  return (
    <div className="group block">
      <div
        onClick={onOpen}
        className="relative h-[205px] w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#112233]"
      >
        <video
          src={video}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />

        {/* Play button */}
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="absolute left-1/2 top-1/2 z-[3] grid h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[16px] text-[#222] shadow-lg transition duration-300 group-hover:scale-110"
        >
          <span className="ml-[3px]">▶</span>
        </button>
      </div>

      <h3 className="mb-0 mt-[12px] font-serif text-[16px] font-medium leading-[1.15] text-[#151515]">
        {title}
      </h3>
    </div>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [active, setActive] = useState("All");
  const [playing, setPlaying] = useState<ApiVideo | null>(null);
  const [testimonials, setTestimonials] = useState<ApiTestimonial[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getPublicTestimonials().then(setTestimonials);
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<ApiVideo[]>("/videos")
      .then((data) => {
        if (!cancelled) setVideos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;

    document.body.style.overflow = "hidden";
    videoRef.current?.play().catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlaying(null);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playing]);

  const categories = [
    "All",
    ...Array.from(new Set(videos.map((v) => v.category).filter(Boolean))),
  ];

  const filtered = active === "All" ? videos : videos.filter((v) => v.category === active);

  return (
    <main className="bg-paper font-sans text-ink">

      <section className={`bg-cream ${sectionPadTop} pb-10`}>
        <Reveal>
          <p className={eyebrow}>WATCH · REFLECT · DISCOVER</p>
          <h1 className="m-0 font-serif text-[clamp(38px,4.6vw,58px)] font-medium leading-[1]">Videos &amp; Resources</h1>
          <p className="mt-3 text-sm text-muted">Learn, reflect, grow.</p>
        </Reveal>

        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActive(cat)} className={active === cat ? pillActive : pill}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="px-[max(5vw,32px)] py-[60px] max-[700px]:px-6">
        {isLoading ? (
          <p className="text-center text-sm text-muted">Loading videos…</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-[18px] max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
              {filtered.map((v) => (
                <Reveal key={v._id}>
                  <VideoPreviewCard
                    title={v.title}
                    video={v.url}
                    onOpen={() => setPlaying(v)}
                  />
                </Reveal>
              ))}
            </div>
            {filtered.length === 0 && <p className="text-center text-sm text-muted">No videos in this category yet.</p>}
          </>
        )}
      </section>

      {playing && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onClick={() => setPlaying(null)}
        >
          <div
            className="relative h-[90vh] max-h-[760px] w-auto max-w-[92vw] overflow-hidden rounded-[16px] bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPlaying(null)}
              aria-label="Close video"
              className="absolute right-[12px] top-[12px] z-[10] grid h-[36px] w-[36px] place-items-center rounded-full bg-black/60 text-[20px] text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              ×
            </button>

            <video
              ref={videoRef}
              src={playing.url}
              controls
              autoPlay
              playsInline
              className="h-full w-auto max-w-[92vw] object-contain"
            />
          </div>
        </div>
      )}

      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}

      <section className="flex items-center justify-between gap-8 bg-deep px-[max(5vw,32px)] py-[55px] text-white max-[700px]:block">
        <Reveal>
          <p className="font-serif text-2xl">Want support on your transformation journey?</p>
        </Reveal>
        <a className={`${buttonDark} border border-white/40 bg-transparent max-[700px]:mt-6`} href="/book-session">
          Book a Session <span>↗</span>
        </a>
      </section>
    </main>
  );
}
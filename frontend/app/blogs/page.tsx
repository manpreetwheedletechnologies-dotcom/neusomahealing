"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { apiRequest } from "@/lib/api";
import type { ApiInsight } from "@/lib/site-content-api";
import { eyebrow, pill, pillActive, sectionPadTop } from "@/lib/ui";

const tones = ["warm", "sage", "cream", "portrait"] as const;

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={featured ? "col-span-full grid grid-cols-2 gap-8 max-[700px]:grid-cols-1" : ""}>
      <div
        className={`animate-pulse rounded-2xl bg-[#ece4d4] ${featured ? "h-[320px]" : "h-[190px]"}`}
      />
      {featured && (
        <div className="flex flex-col justify-center gap-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-[#ece4d4]" />
          <div className="h-7 w-4/5 animate-pulse rounded-full bg-[#ece4d4]" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-[#ece4d4]" />
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<ApiInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [active, setActive] = useState("All");

  useEffect(() => {
    let cancelled = false;

    apiRequest<ApiInsight[]>("/blog")
      .then((data) => {
        if (!cancelled) setInsights(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setInsights([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(insights.map((a) => a.category).filter(Boolean))),
  ];

  const filtered = active === "All" ? insights : insights.filter((a) => a.category === active);
  const [featuredPost, ...restPosts] = filtered;
  const showFeatured = active === "All" && Boolean(featuredPost);

  return (
    <main className="bg-paper font-sans text-ink">

      {/* HERO */}
      <section className={`bg-cream ${sectionPadTop} pb-14`}>
        <Reveal>
          <p className={eyebrow}>INSIGHTS</p>
          <h1 className="m-0 font-serif text-[clamp(38px,4.6vw,58px)] font-medium leading-[1]">
            Insights for Your Journey
          </h1>
          <p className="mt-3 max-w-[440px] text-sm leading-relaxed text-muted">
            Thoughts, tools and reflections to support your growth.
          </p>
        </Reveal>

        {categories.length > 1 && (
          <div className="mt-9 flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`${active === cat ? pillActive : pill} transition-colors duration-200`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ARTICLES */}
      <section className="px-[max(5vw,32px)] py-[64px] max-[700px]:px-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
            <SkeletonCard featured />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* FEATURED — most recent article gets an editorial, larger treatment */}
            {showFeatured && (
              <Reveal className="relative mb-14 overflow-hidden rounded-[28px]">
                {/* decorative background image behind the featured block */}
                <Image
                  src="/images/hero-neusoma.png"
                  alt=""
                  fill
                  priority
                  className="object-cover opacity-50"
                  aria-hidden="true"
                />

                {/* overlay so both columns stay readable over the photo */}
                <div className="absolute inset-0 bg-[#fdfaf3]/88" />

                <a
                  href={`/blogs/${featuredPost.slug}`}
                  className="group relative z-10 grid grid-cols-2 items-center gap-10 p-8 max-[750px]:grid-cols-1 max-[750px]:gap-5 max-[750px]:p-5 md:p-12"
                >
                  <div className="relative h-[320px] w-full overflow-hidden rounded-[22px] max-[750px]:h-[220px]">
                    <PhotoBlock tone={tones[0]} className="absolute inset-0 h-full w-full" />
                    {featuredPost.featuredImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredPost.featuredImage}
                        alt={featuredPost.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    )}
                    {featuredPost.category && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#fffaf2]/90 px-3 py-1 text-[11px] font-medium text-[#8d5a2b] backdrop-blur-sm">
                        {featuredPost.category}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[.15em] text-[#9a7857]">Latest</p>
                    <h2 className="mt-3 font-serif text-[clamp(24px,2.6vw,34px)] font-medium leading-[1.15] transition-colors group-hover:text-[#8d5a2b]">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-4 text-[13px] text-[#8e775c]">
                      {formatDate(featuredPost.createdAt)}
                      {featuredPost.readTime ? ` · ${featuredPost.readTime}` : ""}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink">
                      Read the article
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </a>
              </Reveal>
            )}

            {/* GRID */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-10 max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
              {(showFeatured ? restPosts : filtered).map((a, i) => (
                <Reveal key={a.slug}>
                  <a href={`/blogs/${a.slug}`} className="group block">
                    <div className="relative mb-4 h-[190px] w-full overflow-hidden rounded-2xl">
                      <PhotoBlock tone={tones[i % tones.length]} className="absolute inset-0 h-full w-full" />
                      {a.featuredImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.featuredImage}
                          alt={a.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        />
                      )}
                      {a.category && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#fffaf2]/90 px-2.5 py-1 text-[10px] font-medium text-[#8d5a2b] backdrop-blur-sm">
                          {a.category}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 font-serif text-xl font-medium leading-tight transition-colors group-hover:text-[#8d5a2b]">
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-[#8e775c]">
                      {formatDate(a.createdAt)}
                      {a.readTime ? ` · ${a.readTime}` : ""}
                    </p>
                  </a>
                </Reveal>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-serif text-lg text-[#8d775f]">Nothing here yet</p>
                <p className="mt-2 text-sm text-muted">
                  No articles in this category yet — check back soon.
                </p>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  );
}
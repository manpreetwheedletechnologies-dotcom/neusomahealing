import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { insights, nervousSystemStates, nervousSystemTopics } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";

export function generateStaticParams() {
  return insights.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = insights.find((a) => a.slug === slug);
  return { title: article ? `${article.title} — NeusomaHealing Practice` : "Insights" };
}

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = insights.find((a) => a.slug === slug);
  if (!article) notFound();

  const isNervousSystem = article.slug === "the-nervous-system-and-emotional-overwhelm";

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      {/* HERO */}
      <section className={`grid grid-cols-[1fr_1fr] items-center gap-[50px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1 max-[900px]:gap-8`}>
        <Reveal>
          <p className={eyebrow}>{article.category.toUpperCase()}</p>
          <h1 className="m-0 mb-4 font-serif text-[clamp(34px,4vw,52px)] font-medium leading-[1.05]">{article.title}</h1>
          <p className="max-w-[420px] text-sm text-muted">
            {isNervousSystem ? "Awareness is the first step toward regulation." : article.excerpt}
          </p>
          <p className="mt-4 text-[11px] text-[#8e775c]">
            {article.date} · {article.readTime}
          </p>
        </Reveal>
        <Reveal>
          <PhotoBlock tone="deep" className="h-[300px] w-full rounded-[28px]" icon="✳" />
        </Reveal>
      </section>

      {isNervousSystem ? (
        <>
          {/* TOPIC NAV */}
          <section className="border-b border-line bg-paper px-[max(5vw,32px)] py-8">
            <Reveal className="flex flex-wrap justify-center gap-8 text-center max-[700px]:gap-5">
              {nervousSystemTopics.map((t) => (
                <span key={t} className="max-w-[140px] text-[11px] leading-tight text-muted">
                  {t}
                </span>
              ))}
            </Reveal>
          </section>

          {/* 4 STATES */}
          <section className="grid grid-cols-2 gap-x-16 gap-y-6 bg-[#f4ede2] px-[max(5vw,32px)] py-[60px] max-[700px]:grid-cols-1">
            <Reveal>
              <h2 className="mb-6 font-serif text-2xl font-medium">The 4 Primary States</h2>
              <div className="divide-y divide-line">
                {nervousSystemStates.map((s) => (
                  <div key={s.title} className="py-4">
                    <strong className="text-sm font-semibold text-ink">{s.title}</strong>
                    <p className="mt-1 text-xs text-muted">{s.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <h2 className="mb-6 font-serif text-2xl font-medium">Regulation Creates Choice</h2>
              <p className="mb-6 max-w-[420px] text-sm leading-[1.8] text-[#5f5140]">
                When your system feels safe, you can respond rather than react. You build awareness. You create space. You create new outcomes.
              </p>
              <a className={buttonDark} href="/coaching">
                Explore Coaching <span>→</span>
              </a>
            </Reveal>
          </section>

          {/* RESOURCES */}
          <section className="bg-deep px-[max(5vw,32px)] py-10 text-white">
            <Reveal>
              <h2 className="mb-6 text-center font-serif text-xl">Resources to Support You</h2>
              <div className="flex flex-wrap justify-center gap-10 text-xs text-[#d5cdbb]">
                <span>Articles</span>
                <span>Videos</span>
                <span>Guided Practices</span>
                <span>Tools</span>
              </div>
            </Reveal>
          </section>
        </>
      ) : (
        <section className="mx-auto max-w-[720px] px-[max(5vw,32px)] py-[60px] text-sm leading-[1.9] text-[#3f4a45]">
          <Reveal>
            <p className="mb-5">{article.excerpt}</p>
            <p className="mb-5">
              Patterns like these rarely appear out of nowhere. They tend to form as intelligent responses to real experiences — ways of staying safe, staying connected, or staying in control when things once felt uncertain.
            </p>
            <p className="mb-5">
              The work is not to fight the pattern, but to understand it: what it protected you from, what it may be costing you now, and what a new, more conscious response could look like.
            </p>
            <p>
              If this resonates, you don&apos;t have to navigate it alone. Coaching offers a compassionate, structured space to explore what&apos;s underneath and build new ways forward.
            </p>
          </Reveal>
          <Reveal className="mt-10">
            <a className={buttonDark} href="/book-session">
              Book a Session <span>↗</span>
            </a>
          </Reveal>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

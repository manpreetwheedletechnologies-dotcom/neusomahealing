import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { VideoThumb } from "@/components/VideoThumb";
import { coachingPrograms } from "@/lib/site-data";
import { allVideos } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";

export function generateStaticParams() {
  return coachingPrograms.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = coachingPrograms.find((p) => p.slug === slug);
  return { title: program ? `${program.title} — NeusomaHealing Practice` : "Coaching" };
}

export default async function CoachingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = coachingPrograms.find((p) => p.slug === slug);
  if (!program) notFound();

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      {/* HERO */}
      <section className={`grid grid-cols-[1fr_1fr] items-center gap-[60px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1 max-[900px]:gap-8`}>
        <Reveal>
          <p className={eyebrow}>COACHING PROGRAM</p>
          <h1 className="m-0 mb-4 font-serif text-[clamp(36px,4vw,52px)] font-medium leading-[1.05]">{program.title}</h1>
          <p className="mb-6 font-serif text-lg italic text-[#8d775f]">{program.tagline}</p>
          <p className="mb-8 max-w-[440px] text-sm leading-[1.8] text-[#59645e]">{program.description}</p>
          <ul className="mb-8 space-y-2">
            {program.details.map((d) => (
              <li key={d} className="flex items-center gap-3 text-sm text-ink">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-gold text-[10px] text-gold">◎</span>
                {d}
              </li>
            ))}
          </ul>
          <a className={buttonDark} href="/book-session">
            Book This Program <span>↗</span>
          </a>
        </Reveal>
        <Reveal>
          <PhotoBlock tone="warm" className="h-[420px] w-full rounded-[28px_28px_28px_120px] max-[900px]:h-[300px]" icon="🪴" />
        </Reveal>
      </section>

      {/* EXPLORE */}
      <section className="bg-[#f4ede2] px-[max(5vw,32px)] py-[70px]">
        <Reveal>
          <h2 className="mb-8 font-serif text-2xl font-medium">What You&apos;ll Explore</h2>
          <div className="grid grid-cols-3 gap-x-10 gap-y-4 max-[700px]:grid-cols-1">
            {program.explore.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-ink">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#c7ac82] text-xs text-[#8b632f]">◈</span>
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* EXPECT */}
      <section className="grid grid-cols-[1fr_1fr] items-center gap-10 bg-[#ece2cf] px-[max(5vw,32px)] py-[60px] max-[900px]:grid-cols-1">
        <Reveal>
          <h2 className="mb-4 font-serif text-2xl font-medium">What to Expect</h2>
          <p className="max-w-[460px] text-sm leading-[1.8] text-[#5f5140]">{program.expect}</p>
        </Reveal>
        <Reveal>
          <PhotoBlock tone="cream" className="h-[220px] w-full rounded-[24px] max-[900px]:h-[180px]" icon="🍵" />
        </Reveal>
      </section>

      {/* RELATED VIDEOS */}
      <section className="px-[max(5vw,32px)] py-[70px]">
        <Reveal>
          <p className={eyebrow}>WATCH · REFLECT · DISCOVER</p>
          <h2 className="mb-8 font-serif text-2xl font-medium">Related Videos</h2>
        </Reveal>
        <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {allVideos.slice(0, 3).map((v) => (
            <Reveal key={v.title}>
              <VideoThumb title={v.title} duration={v.duration} category={v.category} />
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

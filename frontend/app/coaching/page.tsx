import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { coachingPrograms } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPad, sectionPadTop, textLink } from "@/lib/ui";

export const metadata = { title: "Coaching — NeusomaHealing Practice" };

export default function CoachingPage() {
  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      {/* HERO */}
      <section className={`grid grid-cols-[1fr_1fr] items-center gap-[60px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1 max-[900px]:gap-8`}>
        <Reveal>
          <h1 className="m-0 mb-6 font-serif text-[clamp(40px,4.6vw,60px)] font-medium leading-[1]">
            Your transformation deserves space.
          </h1>
          <p className="mb-8 max-w-[440px] text-sm leading-[1.8] text-[#59645e]">
            Compassionate, trauma-informed coaching to help you heal what hurts, regulate what overwhelms you and transform the patterns that keep you stuck.
          </p>
          <a className={buttonDark} href="/book-session">
            Book a Session <span>↗</span>
          </a>
        </Reveal>
        <Reveal>
          <PhotoBlock tone="cream" className="h-[380px] w-full rounded-[28px_28px_28px_120px] max-[900px]:h-[280px]" icon="🪑" />
        </Reveal>
      </section>

      {/* OPTIONS */}
      <section className={sectionPad}>
        <Reveal>
          <p className={eyebrow}>CHOOSE YOUR PATH</p>
          <h2 className="mb-12 font-serif text-[clamp(32px,3.4vw,44px)] font-medium">Coaching Options</h2>
        </Reveal>
        <div className="grid grid-cols-4 gap-5 max-[1000px]:grid-cols-2 max-[700px]:grid-cols-1">
          {coachingPrograms.map((p) => (
            <Reveal key={p.slug} className="flex flex-col justify-between rounded-2xl border border-[#e7ded0] bg-[#fffdf8] p-6">
              <div>
                <h3 className="mb-3 font-serif text-xl font-medium leading-tight">{p.title}</h3>
                <p className="text-xs leading-[1.6] text-muted">{p.description}</p>
              </div>
              <a className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold text-[#8b632f]" href={`/coaching/${p.slug}`}>
                Learn More <span>→</span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SUPPORT BANNER */}
      <section className="flex items-center justify-between gap-10 bg-[#ece2cf] px-[max(5vw,32px)] py-[55px] max-[700px]:block">
        <Reveal>
          <h2 className="max-w-[420px] font-serif text-3xl font-medium leading-tight">
            Change is possible when you feel supported through the process.
          </h2>
        </Reveal>
        <Reveal className="space-y-2 text-sm text-[#5f5140] max-[700px]:mt-6">
          <p>Compassionate Guidance</p>
          <p>Practical Tools</p>
          <p>Lasting Transformation</p>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}

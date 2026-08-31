import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { approach, philosophy, stats } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPad, sectionPadTop } from "@/lib/ui";

export const metadata = { title: "About — NeusomaHealing Practice" };

export default function AboutPage() {
  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      {/* HERO */}
      <section className={`grid grid-cols-[1fr_1fr] items-center gap-[70px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1 max-[900px]:gap-14`}>
  <Reveal>
    <p className={eyebrow}>ABOUT NEUSOMAHEALING</p>
    <h1 className="m-0 mb-6 font-serif text-[clamp(42px,4.8vw,64px)] font-medium leading-[.95] tracking-[-.03em]">
      Meet Sakshi Kashyap
    </h1>
    <p className="mb-1 font-serif text-lg text-[#59645e]">Trauma-Informed Neurosomatic Coach  |  Certified New Code NLP Practitioner</p>
    <p className="max-w-[560px] text-sm leading-[1.8] text-[#59645e]">
      I don't see people as broken. I see human beings who have found intelligent ways to adapt, protect themselves and cope with experiences that once felt overwhelming.
    </p>
    <p className="max-w-[560px] text-sm leading-[1.8] text-[#59645e]">
      I am a Trauma-Informed Neurosomatic Coach and certified New Code NLP Practitioner, trained through ITCA NLP, with over two years of experience helping people understand and transform the patterns that shape the way they think, feel and behave.
    </p>
    <p className="max-w-[560px] text-sm leading-[1.8] text-[#59645e]">
      As the founder of Neusoma Healing, my work brings together New Code NLP, nervous-system awareness, somatic practices and neuroscience-informed methods to support change that lasts — not just change that feels good in the moment.
    </p>
    <br />
    <blockquote className="max-w-[650px] border-l-4 border-[#59645e] pl-6 font-serif text-2xl font-bold italic leading-[1.7] text-[#3a4a45]">
      "When awareness changes, new choices become possible."
    </blockquote>
    <footer className="mt-4 text-right font-serif text-xl font-normal italic text-[#59645e]">
      — Sakshi Kashyap
    </footer>

    <a className={buttonDark} href="/book-session">
      Book a Session <span>↗</span>
    </a>
  </Reveal>

  <Reveal>
    {/* Layered premium photo block */}
    <div className="relative mx-auto w-full max-w-[480px]">
      {/* back frame - offset gold outline for depth */}
      <div
        className="absolute -right-3 -top-3 h-full w-full rounded-[32px] border border-[#C08A45]/40 max-[500px]:-right-2 max-[500px]:-top-2"
        aria-hidden="true"
      />

      {/* main photo */}
      <div className="relative h-[480px] w-full overflow-hidden rounded-[32px] shadow-[0_30px_60px_-20px_rgba(47,63,56,0.35)] max-[900px]:h-[400px] max-[500px]:h-[340px]">
        <PhotoBlock tone="portrait" className="h-full w-full" icon="🌿" />

        {/* soft bottom gradient so badge/text stays legible if a real image is used */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* botanical accent - top right, quiet, on-brand */}
      <svg
        className="absolute -top-6 -right-6 h-14 w-14 text-[#C08A45]/70 max-[500px]:hidden"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24 4C24 4 12 12 12 24C12 32 17 38 24 44C31 38 36 32 36 24C36 12 24 4 24 4Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M24 8V40" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      {/* floating credential card */}
      <div className="absolute -bottom-8 left-6 flex items-center gap-4 rounded-2xl border border-[#e7ded0] bg-[#fdfbf6] px-6 py-4 shadow-[0_16px_40px_-12px_rgba(47,63,56,0.25)] max-[500px]:left-4 max-[500px]:gap-3 max-[500px]:px-4 max-[500px]:py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2F3F38] font-serif text-lg text-[#C08A45]">
          2+
        </div>
        <div>
          <p className="font-serif text-sm font-medium leading-tight text-[#2F3F38]">
            Years of Practice
          </p>
          <p className="text-xs leading-tight text-[#8a8478]">
            Certified New Code NLP Practitioner
          </p>
        </div>
      </div>
    </div>
  </Reveal>
</section>

      {/* PHILOSOPHY */}
      <section className="bg-deep px-[max(5vw,32px)] py-[55px] text-white">
        <Reveal>
          <h2 className="mb-10 text-center font-serif text-3xl font-medium">My Philosophy</h2>
          <div className="grid grid-cols-4 gap-6 max-[700px]:grid-cols-2">
            {philosophy.map(([label, icon]) => (
              <div key={label} className="text-center">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border border-[#bca98499] text-2xl text-[#d5bb94]">
                  {icon}
                </div>
                <p className="text-xs tracking-wide text-[#e3ddcf]">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* APPROACH + STATS */}
      <section className={sectionPad}>
        <div className="grid grid-cols-[1fr_1fr] items-center gap-[70px] max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <Reveal>
            <p className={eyebrow}>HOW I WORK</p>
            <h2 className="mb-6 font-serif text-[clamp(32px,3.4vw,44px)] font-medium leading-[1.05]">My Approach</h2>
            <p className="mb-6 max-w-[440px] text-muted">
              My work brings together New Code NLP, nervous-system awareness, somatic practices and neuroscience-informed methods. Together, these help you understand not just what you feel, but why you feel it, and how to respond differently.
            </p>
            <ul className="space-y-3">
              {approach.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-ink">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-deep text-[10px] text-deep">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <PhotoBlock tone="sage" className="h-[380px] w-full rounded-[28px] max-[900px]:h-[280px]" icon="🤲" />
          </Reveal>
        </div>

        <Reveal className="mt-16 grid grid-cols-4 gap-6 rounded-[22px] bg-[#ece2cf] px-8 py-10 text-center max-[700px]:grid-cols-2 max-[700px]:gap-y-8">
          {stats.map(([num, label]) => (
            <div key={label}>
              <p className="font-serif text-4xl text-ink">{num}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* CLOSING CTA */}
      <section className="bg-[#f0e8dc] px-[max(5vw,32px)] py-[70px] text-center">
        <Reveal>
          <h2 className="mb-6 font-serif text-3xl font-medium">Ready to begin your own journey?</h2>
          <a className={buttonDark} href="/book-session">
            Book a Session <span>↗</span>
          </a>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}

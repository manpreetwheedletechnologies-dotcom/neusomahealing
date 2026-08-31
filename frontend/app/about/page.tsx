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
      <section className={`grid grid-cols-[1fr_1fr] items-center gap-[70px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1 max-[900px]:gap-10`}>
        <Reveal>
          <p className={eyebrow}>ABOUT NEUSOMAHEALING</p>
          <h1 className="m-0 mb-6 font-serif text-[clamp(42px,4.8vw,64px)] font-medium leading-[.95] tracking-[-.03em]">
            Meet Sakshi Kashyap
          </h1>
          <p className="mb-1 font-serif text-lg text-[#59645e]">Mid-Life Transformation Coach</p>
          <p className="mb-6 font-serif text-lg text-[#59645e]">New Code NLP Practitioner</p>
          <p className="max-w-[460px] text-sm leading-[1.8] text-[#59645e]">
            I don&apos;t see people as broken. I see human beings who have often developed intelligent ways of surviving experiences that once felt overwhelming.
          </p>
          <p className="mt-8 font-serif text-3xl italic text-[#3a4a45]">Sakshi Kashyap</p>
        </Reveal>
        <Reveal>
          <PhotoBlock tone="portrait" className="h-[460px] w-full rounded-[28px] max-[900px]:h-[340px]" icon="🌿" />
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
              My work draws upon New Code NLP, emotional intelligence, cognitive reframing and nervous-system-aware approaches to facilitate deeper personal change.
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

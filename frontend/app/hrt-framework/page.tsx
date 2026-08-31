import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { framework, journey } from "@/lib/home-data";
import { buttonDark, sectionPad, sectionPadTop } from "@/lib/ui";

export const metadata = { title: "H.R.T. Framework — NeusomaHealing Practice" };

export default function HrtFrameworkPage() {
  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      {/* HERO */}
      <section className={`bg-cream text-center ${sectionPadTop}`}>
        <Reveal>
          <h1 className="m-0 font-serif text-[clamp(42px,5.5vw,72px)] font-medium leading-[.95] tracking-[-.03em]">
            H.R.T. Framework
          </h1>
          <p className="mt-4 font-serif text-lg italic text-[#8d775f]">Heal. Regulate. Transform.</p>
        </Reveal>

        <div className="relative mx-auto mt-16 grid max-w-[1100px] grid-cols-3 items-start gap-[22px] max-[900px]:grid-cols-1">
          {framework.map((item, index) => (
            <Reveal
              key={item.number}
              className="relative rounded-[24px] border border-[#ddcfbc] bg-[#fffaf2] p-[34px] text-left"
            >
              <span className="text-[10px] tracking-[.2em] text-[#9a7857]">{item.number}</span>
              <h3 className="mt-2 font-serif text-2xl font-semibold uppercase tracking-wide">{item.title}</h3>
              <div className="my-6 font-serif text-5xl text-[#a9783d]">
                {index === 0 ? "♡" : index === 1 ? "≈" : "✧"}
              </div>
              <h4 className="mb-3 font-serif text-lg font-medium">{item.subtitle}</h4>
              <p className="text-[13px] text-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* JOURNEY */}
      <section className="overflow-hidden bg-deep px-[5vw] py-[105px] text-[#f7f1e7]">
        <Reveal>
          <h2 className="text-center font-serif text-[clamp(32px,4vw,52px)] font-medium leading-[1]">The Journey</h2>
        </Reveal>
        <div className="relative mx-auto mt-[60px] grid max-w-[1250px] grid-cols-5 gap-[25px] before:absolute before:left-[4%] before:right-[4%] before:top-[27px] before:h-px before:bg-[#77908766] before:content-[''] max-[1000px]:grid-cols-[repeat(5,180px)] max-[1000px]:overflow-x-auto max-[1000px]:pb-5 max-[1000px]:before:hidden">
          {journey.map(([title, subtitle, body], i) => (
            <div className="relative z-[1] text-center" key={title}>
              <div className="mx-auto mb-[18px] grid h-[55px] w-[55px] place-items-center rounded-full border border-[#bca98499] bg-deep text-[10px] text-[#d5bb94]">
                0{i + 1}
              </div>
              <h3 className="m-0 font-serif text-2xl font-medium">{title}</h3>
              <strong className="mt-[6px] block text-[11px] font-normal text-[#d2c7b5]">{subtitle}</strong>
              <p className="text-[11px] leading-[1.5] text-[#aebcb4]">{body}</p>
              {i < journey.length - 1 && (
                <span className="absolute -right-[22px] top-[15px] text-[25px] text-[#bca984] max-[1000px]:hidden">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CLOSING */}
      <section className={`${sectionPad} flex items-center justify-between gap-10 bg-[#f0e8dc] max-[700px]:block`}>
        <Reveal>
          <p className="max-w-[520px] font-serif text-2xl leading-[1.3]">
            You don&apos;t have to fight yourself to change yourself.
            <br />
            Understanding creates choice. Choice creates freedom.
          </p>
        </Reveal>
        <a className={`${buttonDark} max-[700px]:mt-6`} href="/coaching">
          Explore Coaching <span>→</span>
        </a>
      </section>

      <SiteFooter />
    </main>
  );
}

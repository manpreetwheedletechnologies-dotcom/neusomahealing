import { Header } from "@/components/Header";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { framework, frameworkIntro, frameworkWhy } from "@/lib/home-data";
import { buttonDark, sectionPadTop } from "@/lib/ui";
import { JourneySection } from "@/components/JourneySection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { getPublicTestimonials } from "@/lib/site-content-api";

export const metadata = { title: "H.R.T. Framework — NeusomaHealing Practice" };

// Testimonials are DB-driven and can change without a rebuild.
export const dynamic = "force-dynamic";

export default async function HrtFrameworkPage() {
  const testimonials = await getPublicTestimonials();

  return (
    <main className="bg-paper font-sans text-ink">

      {/* HERO */}
      <section className={`relative overflow-hidden bg-cream pb-28 text-center ${sectionPadTop} md:pb-36`}>
        {/* background image */}
        <Image
          src="/images/rht.png"
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />

        {/* soft overlay so the heading and cards stay readable over the photo */}
        <div className="absolute inset-0 bg-cream/55" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,rgba(169,120,61,0.10),transparent)]"
        />

        <Reveal className="relative z-10">
          <h1 className="relative m-0 font-serif text-[clamp(42px,5.5vw,72px)] font-medium leading-[.95] tracking-[-.03em]">
            H.R.T. Framework
          </h1>
          <p className="relative mt-5 font-serif text-lg italic text-[#8d775f]">
            A gentle, structured path from surviving to truly living.
          </p>
        </Reveal>

        <div className="relative z-10 mx-auto mt-20 grid max-w-[1100px] grid-cols-3 items-start gap-[28px] max-[900px]:grid-cols-1 max-[900px]:gap-14">
          {/* connecting thread across the three phases — this genuinely is a sequence */}
          <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-[26px] hidden h-px bg-[#ddc9a3] md:block" />

          {framework.map((item, index) => (
            <Reveal key={item.number} className="relative text-left">
              <div className="relative z-10 mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#ddc9a3] bg-cream font-serif text-lg text-[#8d5a2b] max-[900px]:mx-0">
                {item.number}
              </div>

              <div className="mt-6 rounded-[20px] border border-[#e4d6bd] bg-[#fffaf2] p-[30px] transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(90,63,24,0.35)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1e4c8] font-serif text-lg text-[#a9783d]">
                    {index === 0 ? "♡" : index === 1 ? "≈" : "✧"}
                  </span>
                  <h3 className="font-serif text-xl font-medium">{item.title}</h3>
                </div>

                <h4 className="mb-3 mt-5 font-serif text-lg leading-snug">{item.subtitle}</h4>
                <p className="text-[13.5px] leading-[1.65] text-muted">{item.body}</p>

                <ul className="mt-5 space-y-2.5 border-t border-[#e6dac6] pt-5">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[13px] leading-[1.55] text-[#5c5344]">
                      <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#a9783d]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FRAMEWORK — DEEPER EXPLANATION */}
      <section className="bg-paper px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px]">
          <Reveal>
            <p className="font-serif text-lg italic text-[#8d775f]">{frameworkIntro.eyebrow}</p>
            <h2 className="mt-3 font-serif text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.15]">
              {frameworkIntro.heading}
            </h2>
          </Reveal>

          <div className="mt-8 space-y-5">
            {frameworkIntro.body.map((paragraph, i) => (
              <Reveal key={i}>
                <p className="text-[15px] leading-[1.85] text-[#4b453c]">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY THIS WORKS */}
      <section className="bg-[#f6f0e4] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <Reveal>
            <h2 className="font-serif text-[clamp(26px,3vw,36px)] font-medium">
              Why this framework works
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-x-14 gap-y-12 max-[700px]:grid-cols-1 max-[700px]:gap-y-10">
            {frameworkWhy.map((reason, i) => (
              <Reveal
                key={reason.title}
                className="border-l-2 border-[#d9c39a] pl-6"
              >
                <span className="font-serif text-2xl text-[#a9783d]">
                  {["♡", "◆", "✳", "✦"][i % 4]}
                </span>
                <h3 className="mt-3 font-serif text-lg font-medium">{reason.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-[#5c5344]">{reason.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <JourneySection flag="home" />

      {/* TESTIMONIALS */}
      <TestimonialsSection testimonials={testimonials} />

      {/* CLOSING */}
      <section className="relative flex flex-wrap items-center justify-between gap-10 overflow-hidden bg-[#f0e8dc] px-6 py-20 md:px-16 md:py-28">
        {/* background image */}
        <Image
          src="/images/rht.png"
          alt=""
          fill
          priority={false}
          className="object-cover"
          aria-hidden="true"
        />

        {/* soft overlay so the text stays readable over the photo */}
        {/* <div className="absolute inset-0 bg-[#f0e8dc]/78" /> */}
        {/* <div className="absolute inset-0 bg-[#f0e8dc]/80" /> */}

        <Reveal className="relative z-10">
          <p className="max-w-[520px] font-serif text-2xl leading-[1.4] md:text-[28px]">
            You were never broken — only responding the only way you knew how.
            <br />
            Understanding creates choice. Choice creates freedom.
          </p>
        </Reveal>
        <a className={`${buttonDark} relative z-10`} href="/coaching">
          Begin Your Journey <span>→</span>
        </a>
      </section>

    </main>
  );
}
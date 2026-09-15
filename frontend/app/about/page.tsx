"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PhotoBlock } from "@/components/PhotoBlock";
import { approach, stats } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPad, sectionPadTop } from "@/lib/ui";
import Link from "next/link";
import { JourneySection } from "@/components/JourneySection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { getPublicTestimonials } from "@/lib/site-content-api";
import type { ApiTestimonial } from "@/lib/site-content-api";

const textContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function AboutPage() {
  const [testimonials, setTestimonials] = useState<ApiTestimonial[]>([]);

  useEffect(() => {
    getPublicTestimonials().then(setTestimonials);
  }, []);

  return (
    <main className="bg-paper font-sans text-ink">

      {/* HERO */}
      <section
        className={`grid grid-cols-[1fr_1fr] items-center gap-[70px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1 max-[900px]:gap-14`}
      >
        <motion.div
          variants={textContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="max-[900px]:order-2"
        >
          <motion.p variants={fadeUp} className={eyebrow}>
            ABOUT NEUSOMAHEALING
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="m-0 mb-6 font-serif text-[clamp(42px,4.8vw,64px)] font-medium leading-[.95] tracking-[-.03em]"
          >
            Meet Sakshi Kashyap
          </motion.h1>

          <motion.p variants={fadeUp} className="mb-1 font-serif text-lg text-[#59645e]">
            Trauma-Informed Neurosomatic Coach&nbsp;&nbsp;|&nbsp;&nbsp;Certified New Code NLP Practitioner
          </motion.p>

          <motion.p variants={fadeUp} className="max-w-[560px] text-sm leading-[1.8] text-[#59645e]">
            I don&apos;t see people as broken. I see human beings who have found intelligent ways to adapt, protect themselves and cope with experiences that once felt overwhelming.
          </motion.p>

          <motion.p variants={fadeUp} className="max-w-[560px] text-sm leading-[1.8] text-[#59645e]">
            I am a Trauma-Informed Neurosomatic Coach and certified New Code NLP Practitioner, trained through ITCA NLP, with over two years of experience helping people understand and transform the patterns that shape the way they think, feel and behave.
          </motion.p>

          <motion.p variants={fadeUp} className="max-w-[560px] text-sm leading-[1.8] text-[#59645e]">
            As the founder of Neusoma Healing, my work brings together New Code NLP, nervous-system awareness, somatic practices and neuroscience-informed methods to support change that lasts — not just change that feels good in the moment.
          </motion.p>

          <br />

          <motion.blockquote
            variants={fadeUp}
            className="max-w-[650px] border-l-4 border-[#59645e] pl-6 font-serif text-2xl font-bold italic leading-[1.7] text-[#3a4a45]"
          >
            &quot;When awareness changes, new choices become possible.&quot;
          </motion.blockquote>

          <motion.footer variants={fadeUp} className="mt-4 flex justify-end">
            <img
              src="/sign.png"
              alt="Sakshi Kashyap signature"
              className="h-[80px] w-auto object-contain"
            />
          </motion.footer>

          <motion.a
            variants={fadeUp}
            className={`${buttonDark} group inline-flex items-center gap-2`}
            href="/book-session"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Book a Session{" "}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              ↗
            </motion.span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[480px] max-[900px]:order-1"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-[580px] w-full overflow-hidden rounded-[32px] max-[900px]:h-[400px] max-[500px]:h-[400px]"
          >
            <img
              src="/images/about.png"
              alt="Sakshi Kashyap, founder of Neusoma Healing"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/25 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -bottom-8 left-6 max-[500px]:left-4"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="flex items-center gap-4 rounded-2xl border border-[#e7ded0] bg-[#fdfbf6] px-6 py-4 shadow-[0_16px_40px_-12px_rgba(47,63,56,0.25)] max-[500px]:gap-3 max-[500px]:px-4 max-[500px]:py-3"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2F3F38] font-serif text-lg text-[#C08A45]"
              >
                2+
              </motion.div>
              <div>
                <p className="font-serif text-sm font-medium leading-tight text-[#2F3F38]">
                  Years of Practice
                </p>
                <p className="text-xs leading-tight text-[#8a8478]">
                  Certified New Code NLP Practitioner
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* PHILOSOPHY */}
      <JourneySection flag="about" />

      {/* APPROACH + STATS */}
      <section className={sectionPad}>
        {/* ---------- Intro: two-column grid ---------- */}
        <div className="px-[max(5vw,32px)] pt-[110px] grid grid-cols-[1.1fr_1fr] items-center gap-[70px] max-[900px]:grid-cols-1 max-[900px]:gap-10">

          {/* Left column — copy + approach list */}
          <Reveal>
            <p className={`${eyebrow} flex items-center gap-3`}>
              <span className="inline-block h-px w-8 bg-deep/50" />
              HOW I WORK
            </p>

            <h2 className="mb-6 font-serif text-[clamp(36px,4vw,56px)] font-medium leading-[1.05]">
              My Approach
            </h2>

            <p className="mb-8 max-w-[560px] text-lg text-muted">
              My work draws upon New Code NLP, emotional intelligence, cognitive reframing and nervous system-aware approaches to facilitate deeper personal change.
            </p>

            <ul className="space-y-5">
              {approach.map((item) => (
                <li
                  key={item}
                  className="group flex items-center gap-4 text-base text-ink transition-transform duration-300 hover:translate-x-1"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-deep text-xs text-white transition-all duration-300 group-hover:scale-110 group-hover:bg-ink">
                    +
                  </span>
                  <span className="relative">
                    {item}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-deep/40 transition-all duration-300 group-hover:w-full" />
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Right column — arch photo with soft shadow */}
          <Reveal>
            <div className="group relative mx-auto h-[520px] w-full max-w-[480px] max-[900px]:h-[360px]">
              {/* offset accent outline behind the arch */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-tl-[240px] border border-deep/15 translate-x-3 translate-y-3 transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4"
              />
              <div className="relative h-full w-full overflow-hidden rounded-tl-[240px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
                <img
                  src="/images/approach.png"
                  alt="Open hand with leaf shadows, representing a nurturing coaching approach"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                {/* soft top-left highlight for depth */}
                <div className="pointer-events-none absolute inset-0 rounded-tl-[240px] ring-1 ring-inset ring-white/10" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* ---------- Stat bar ---------- */}
        <Reveal className="relative mt-24 bg-[#ece2cf] px-8 py-14">
          {/* thin top & bottom rules for a more editorial feel */}
          <span aria-hidden className="absolute inset-x-8 top-0 h-px bg-deep/15" />
          <span aria-hidden className="absolute inset-x-8 bottom-0 h-px bg-deep/15" />

          <div className="grid grid-cols-4 text-center max-[700px]:grid-cols-2 max-[700px]:gap-y-10">
            {stats.map(([num, label], i) => (
              <div
                key={label}
                className={[
                  "group px-4 transition-transform duration-300 hover:-translate-y-1",
                  i !== 0 ? "border-l border-deep/15 max-[700px]:border-l-0" : "",
                  i % 2 === 1 ? "max-[700px]:border-l max-[700px]:border-deep/15" : "",
                ].join(" ")}
              >
                <p className="font-serif text-5xl leading-none text-ink transition-colors duration-300 group-hover:text-deep">
                  {num}
                </p>
                <p className="mt-3 text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}

    </main>
  );
}
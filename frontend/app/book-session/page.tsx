"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { sessionTypes } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const times = ["11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];
const highlights = ["Safe & Confidential", "Personalised Guidance", "Online Sessions"];

export default function BookSessionPage() {
  const [sessionType, setSessionType] = useState<string>(sessionTypes[0].title);
  const [day, setDay] = useState(14);
  const [time, setTime] = useState(times[2]);

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      <section className={`bg-cream ${sectionPadTop}`}>
        <div className="grid grid-cols-[0.8fr_1.2fr] gap-[60px] max-[900px]:grid-cols-1">
          <Reveal>
            <p className={eyebrow}>BOOK A SESSION</p>
            <h1 className="m-0 mb-5 font-serif text-[clamp(34px,4vw,50px)] font-medium leading-[1.05]">
              Book Your Transformation Session
            </h1>
            <p className="mb-8 max-w-[380px] text-sm leading-[1.8] text-[#59645e]">
              Take the first step toward healing, regulation and transformation.
            </p>
            <ul className="space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm text-ink">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-gold text-[10px] text-gold">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-[1fr_1.3fr] gap-6 max-[700px]:grid-cols-1">
              <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5">
                <h3 className="mb-4 text-sm font-semibold">Select a Session Type</h3>
                <div className="space-y-3">
                  {sessionTypes.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => setSessionType(s.title)}
                      className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        sessionType === s.title ? "border-gold bg-[#fbeedb]" : "border-line bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span
                          className={`h-3 w-3 rounded-full border ${
                            sessionType === s.title ? "border-gold bg-gold" : "border-[#c9bda6]"
                          }`}
                        />
                        {s.title}
                      </span>
                      <span className="mt-1 block pl-5 text-[11px] text-muted">{s.duration}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1.3fr_1fr] gap-5 rounded-[18px] border border-line bg-[#fffaf3] p-5 max-[500px]:grid-cols-1">
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                    <span>‹</span>
                    <span>May 2026</span>
                    <span>›</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                    {days.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDay(d)}
                        className={`aspect-square rounded-full text-[11px] ${
                          d === day ? "bg-deep text-white" : "text-ink hover:bg-[#eee2cd]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Available Times (IST)</h3>
                  <div className="space-y-2">
                    {times.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`block w-full rounded-full border px-3 py-2 text-[11px] ${
                          time === t ? "border-gold bg-[#fbeedb] font-semibold" : "border-line bg-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button className={`${buttonDark} mt-6 w-full justify-center py-4`}>
              Continue — {sessionType}, May {day} at {time}
            </button>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

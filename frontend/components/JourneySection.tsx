"use client";

import { ComponentType } from "react";
import { Reveal } from "@/components/Reveal";
import { journey, philosophy } from "@/lib/home-data";
import { Heart, DoorOpen, Flower2, CircleUserRound, PersonStanding, HeartHandshake, ShieldCheck, Waves, Sparkles } from "lucide-react";
// Flower2 doubles as: (a) a journey icon in journeyIcons, and (b) the fixed
// decorative flowers in the section background — both come from this import.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ItemTuple = readonly [string, string, string];
type IconType = ComponentType<{ strokeWidth?: number; className?: string }> | string;

type Flag = "home" | "about" | "hrt";

type JourneySectionProps = {
  flag: Flag;
  className?: string;
};

// ---------------------------------------------------------------------------
// Internal config — one entry per page. Add a new flag here if a 4th page
// needs this section; nothing else in the file needs to change.
// ---------------------------------------------------------------------------

const journeyIcons: IconType[] = [PersonStanding, Heart, CircleUserRound, DoorOpen, Flower2];
const philosophyIcons: IconType[] = [HeartHandshake, ShieldCheck, Waves, Sparkles];

const CONFIG: Record<
  Flag,
  {
    heading: string;
    items: readonly ItemTuple[];
    icons: IconType[];
  }
> = {
  home: { heading: "The Transformation Journey", items: journey, icons: journeyIcons },
  hrt: { heading: "The Journey", items: journey, icons: journeyIcons },
  about: { heading: "My Philosophy", items: philosophy, icons: philosophyIcons },
};

// ---------------------------------------------------------------------------
// Icon renderer — handles both lucide components and text glyphs
// ---------------------------------------------------------------------------

function RenderIcon({ icon, className }: { icon: IconType; className: string }) {
  if (typeof icon === "string") {
    return <span className={`${className} inline-flex items-center justify-center`}>{icon}</span>;
  }
  const Icon = icon;
  return <Icon strokeWidth={1.25} className={className} />;
}

// ---------------------------------------------------------------------------
// Main component — usage: <JourneySection flag="home" />
// ---------------------------------------------------------------------------

export function JourneySection({ flag, className = "" }: JourneySectionProps) {
  const { heading, items, icons } = CONFIG[flag];

  return <CompactLayout heading={heading} items={items} icons={icons} className={className} />;
}

// ---------------------------------------------------------------------------
// Layout: compact — same look as Home page (icon circles + snake line),
// reused for every flag. Only heading/items/icons change.
// ---------------------------------------------------------------------------

function CompactLayout({
  heading,
  items,
  icons,
  className,
}: {
  heading: string;
  items: readonly ItemTuple[];
  icons: IconType[];
  className: string;
}) {
  const mdColsClass =
    {
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    }[items.length] ?? "md:grid-cols-5";

  return (
    <section
      className={`relative isolate overflow-hidden bg-[#003b3b] px-4 py-6 text-[#f7f1e7] sm:px-6 sm:py-8 md:h-[280px] md:px-4 md:py-3 ${className}`}
    >
      {/* Right botanical decoration */}
      <div className="pointer-events-none absolute right-[-10px] top-[-20px] opacity-[0.10] sm:right-[-18px] sm:top-[-35px]">
        <Flower2
          strokeWidth={0.6}
          className="h-[120px] w-[120px] rotate-[15deg] text-[#bca984] sm:h-[150px] sm:w-[150px] md:h-[180px] md:w-[180px]"
        />
      </div>

      <div className="pointer-events-none absolute bottom-[-40px] right-[-6px] opacity-[0.10] sm:bottom-[-50px] sm:right-[-10px]">
        <Flower2
          strokeWidth={0.6}
          className="h-[130px] w-[130px] rotate-[-12deg] text-[#bca984] sm:h-[160px] sm:w-[160px] md:h-[190px] md:w-[190px]"
        />
      </div>

      {/* Heading */}
      <Reveal>
        <h2 className="relative z-10 m-0 text-center font-serif text-[22px] font-medium leading-none tracking-[-0.02em] text-[#f4eee3] sm:text-[24px] md:text-[27px]">
          {heading}
        </h2>
      </Reveal>

      <div className="relative mx-auto mt-3 max-w-[1190px] sm:mt-4 md:mt-[5px]">
        {/* ====== Curved journey line — mobile (2-col layout, 3 rows) ====== */}
        <svg
          className="pointer-events-none absolute left-0 top-[70px] z-0 h-[320px] w-full md:hidden"
          viewBox="0 0 400 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Snake line: row1 (L→R) → down → row2 (R→L) → down → row3 (L→R) */}
          <path
            d="
              M 100 40
              C 160 40, 180 0, 240 0
              C 300 0, 320 40, 380 40
              M 380 40
              C 380 100, 320 100, 300 120
              C 260 160, 240 120, 200 120
              C 160 120, 140 160, 100 160
              C 60 160, 40 120, 20 120
              M 20 120
              C 20 180, 80 180, 100 200
              C 140 240, 160 200, 200 200
              C 240 200, 260 240, 300 240
              C 340 240, 360 200, 380 200
              M 380 200
              C 380 260, 320 260, 300 280
            "
            fill="none"
            stroke="#779087"
            strokeOpacity="0.55"
            strokeWidth="1.1"
          />

          {/* Dots on the mobile curve (6 dots: 2 per row) */}
          {[
            { cx: 100, cy: 40 }, // row1 left
            { cx: 300, cy: 40 }, // row1 right
            { cx: 100, cy: 160 }, // row2 left
            { cx: 300, cy: 160 }, // row2 right
            { cx: 100, cy: 280 }, // row3 left
            { cx: 300, cy: 280 }, // row3 right
          ].map((dot, i) => (
            <g key={i}>
              <circle cx={dot.cx} cy={dot.cy} r="8" fill="#d8c59f" opacity="0.08" />
              <circle cx={dot.cx} cy={dot.cy} r="2.7" fill="#e6d09d" />
            </g>
          ))}
        </svg>

        {/* ====== Curved journey line — desktop (original) ====== */}
        <svg
          className="pointer-events-none absolute left-0 top-[166px] z-0 hidden h-[55px] w-full md:block"
          viewBox="0 0 1190 55"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="
              M 35 38
              C 125 38, 145 5, 235 5
              C 315 5, 330 38, 425 38
              C 515 38, 535 5, 625 5
              C 710 5, 730 38, 820 38
              C 905 38, 925 5, 1015 5
              C 1080 5, 1110 25, 1155 25
            "
            fill="none"
            stroke="#779087"
            strokeOpacity="0.55"
            strokeWidth="1.1"
          />

          {(() => {
            const step = 1190 / (items.length + 1);
            return items.map((_, index) => {
              const x = Math.round(step * (index + 1));
              const y = index % 2 === 0 ? 38 : 5;
              return (
                <g key={x}>
                  <circle cx={x} cy={y} r="8" fill="#d8c59f" opacity="0.08" />
                  <circle cx={x} cy={y} r="2.7" fill="#e6d09d" />
                </g>
              );
            });
          })()}
        </svg>

        {/* Journey items */}
        <div
          className={`relative z-10 grid grid-cols-2 gap-x-4 gap-y-10 pt-2 sm:gap-x-6 sm:gap-y-12 md:gap-[16px] md:gap-y-0 md:pt-[7px] ${mdColsClass}`}
        >
          {items.map(([title, subtitle, body], index) => (
            <Reveal key={title}>
              <div className="group relative flex flex-col items-center text-center">
                {/* Icon */}
                <div
                  className="
                    relative mb-2
                    grid h-[64px] w-[64px] place-items-center
                    rounded-full
                    border border-[#bca98466]
                    border-b-0
                    bg-[#003838]
                    shadow-[0_0_0_1px_rgba(188,169,132,0.04)]
                    transition-all duration-500
                    group-hover:border-[#d5bb94aa]
                    group-hover:shadow-[0_0_25px_rgba(210,190,145,0.12)]
                    sm:h-[70px] sm:w-[70px] sm:mb-[8px]
                  "
                >
                  <div className="absolute inset-[7px] rounded-full border border-[#bca98426] border-b-0" />
                  <RenderIcon
                    icon={icons[index]}
                    className="relative z-10 h-[34px] w-[34px] text-[#cdb68e] transition-transform duration-500 group-hover:scale-110 sm:h-[38px] sm:w-[38px]"
                  />
                </div>

                {/* Arrow — desktop only */}
                {index < items.length - 1 && (
                  <span
                    className="
                      pointer-events-none
                      absolute right-[-17px] top-[24px]
                      hidden
                      text-[25px]
                      font-light
                      leading-none
                      text-[#bca984]
                      md:block
                    "
                  >
                    →
                  </span>
                )}

                {/* Title */}
                <h3
                  className="
                    m-0
                    font-sans
                    text-[12px]
                    font-semibold
                    uppercase
                    leading-[1.1]
                    tracking-[0.01em]
                    text-[#f1eadc]
                    sm:text-[13px]
                  "
                >
                  {title}
                </h3>

                {/* Subtitle */}
                <strong
                  className="
                    mt-[6px]
                    max-w-[125px]
                    text-[10px]
                    font-normal
                    leading-[1.3]
                    text-[#e0d7c7]
                  "
                >
                  {subtitle}
                </strong>

                {/* Body */}
                <p
                  className="
                    mt-[2px]
                    max-w-[130px]
                    whitespace-pre-line
                    text-[9px]
                    leading-[1.35]
                    text-[#aebcb4]
                  "
                >
                  {body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
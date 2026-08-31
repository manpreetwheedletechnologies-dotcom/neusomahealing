import { Reveal } from "@/components/Reveal";
import {
  Heart,
  DoorOpen,
  Flower2,
  CircleUserRound,
  PersonStanding,
} from "lucide-react";

import { journey } from "@/lib/home-data";

const journeyIcons = [
  PersonStanding,
  Heart,
  CircleUserRound,
  DoorOpen,
  Flower2,
];

export function JourneySection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#003b3b] px-[16px] py-[12px] text-[#f7f1e7] md:h-[280px]">
      {/* Right botanical decoration */}
      <div className="pointer-events-none absolute right-[-18px] top-[-35px] opacity-[0.10]">
        <Flower2
          strokeWidth={0.6}
          className="h-[180px] w-[180px] rotate-[15deg] text-[#bca984]"
        />
      </div>

      <div className="pointer-events-none absolute bottom-[-65px] right-[-10px] opacity-[0.10]">
        <Flower2
          strokeWidth={0.6}
          className="h-[190px] w-[190px] rotate-[-12deg] text-[#bca984]"
        />
      </div>

      {/* Heading */}
      <Reveal>
        <h2 className="relative z-10 m-0 text-center font-serif text-[25px] font-medium leading-none tracking-[-0.02em] text-[#f4eee3] md:text-[27px]">
          The Transformation Journey
        </h2>
      </Reveal>

      <div className="relative mx-auto mt-[5px] max-w-[1190px]">
        {/* Curved journey line */}
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

          {[35, 235, 425, 625, 820, 1015].map((x, index) => {
            const y = index % 2 === 0 ? 38 : 5;

            return (
              <g key={x}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="#d8c59f"
                  opacity="0.08"
                />

                <circle
                  cx={x}
                  cy={y}
                  r="2.7"
                  fill="#e6d09d"
                />
              </g>
            );
          })}
        </svg>

        {/* Journey items */}
        <div className="relative z-10 grid grid-cols-1 gap-8 pt-[7px] md:grid-cols-5 md:gap-[16px]">
          {journey.map(([title, subtitle, body], index) => {
            const Icon = journeyIcons[index];

            return (
              <Reveal key={title}>
                <div className="group relative flex flex-col items-center text-center">
                  {/* Icon */}
                  <div
                    className="
                      relative mb-[8px]
                      grid h-[70px] w-[70px] place-items-center
                      rounded-full
                      border border-[#bca98466]
                      border-b-0
                      bg-[#003838]
                      shadow-[0_0_0_1px_rgba(188,169,132,0.04)]
                      transition-all duration-500
                      group-hover:border-[#d5bb94aa]
                      group-hover:shadow-[0_0_25px_rgba(210,190,145,0.12)]
                    "
                  >
                    <div className="absolute inset-[7px] rounded-full border border-[#bca98426] border-b-0" />

                    <Icon
                      strokeWidth={1.25}
                      className="
                        relative z-10
                        h-[38px] w-[38px]
                        text-[#cdb68e]
                        transition-transform duration-500
                        group-hover:scale-110
                      "
                    />
                  </div>

                  {/* Arrow */}
                  {index < journey.length - 1 && (
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
                      text-[13px]
                      font-semibold
                      uppercase
                      leading-[1.1]
                      tracking-[0.01em]
                      text-[#f1eadc]
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
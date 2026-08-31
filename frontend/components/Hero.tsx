"use client";

import Image from "next/image";
import { buttonDark, buttonLight, eyebrow } from "@/lib/home-styles";

const round = (n: number) => Math.round(n * 100) / 100;

const makeWave = (
  startX: number,
  startY: number,
  angleDeg: number,
  length: number,
  amplitude: number,
  segments: number
) => {
  const angle = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -dy;
  const py = dx;

  let d = `M ${round(startX)} ${round(startY)}`;
  const segLen = length / segments;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const baseX = startX + dx * segLen * i;
    const baseY = startY + dy * segLen * i;
    const wave = Math.sin(t * Math.PI * 2.2) * amplitude * (1 - t * 0.3);
    const cpX = baseX + px * wave;
    const cpY = baseY + py * wave;
    const prevT = (i - 0.5) / segments;
    const midX = startX + dx * segLen * (i - 0.5) + px * Math.sin(prevT * Math.PI * 2.2) * amplitude;
    const midY = startY + dy * segLen * (i - 0.5) + py * Math.sin(prevT * Math.PI * 2.2) * amplitude;
    d += ` Q ${round(midX)} ${round(midY)} ${round(cpX)} ${round(cpY)}`;
  }
  return d;
};

export function Hero() {
  return (
   <section className="relative grid min-h-screen grid-cols-[50%_50%] overflow-hidden bg-[#0a2124] max-[1000px]:min-h-[850px] max-[1000px]:grid-cols-1 max-[700px]:min-h-[790px]">
      <div className="relative z-[3] max-w-[700px] pb-[110px] pl-[8vw] pr-0 pt-[190px] max-[1000px]:max-w-[650px] max-[1000px]:px-[7vw] max-[1000px]:pb-20 max-[1000px]:pt-[160px] max-[700px]:pb-10 max-[700px]:pl-6 max-[700px]:pr-6 max-[700px]:pt-[125px]">
        <p
          className={`${eyebrow} opacity-0 animate-slide-1 max-[700px]:mb-3 transition-all duration-300 ease-out hover:translate-x-2 text-cream cursor-default`}
        >
          NEUSOMAHEALING PRACTICE
        </p>

        <h1 className="m-0 mb-8 text-[clamp(70px,7.3vw,112px)] font-medium leading-[.77] tracking-[-.045em] max-[700px]:text-[70px]">
          <span className="block opacity-0 animate-slide-2 not-italic transition-all duration-300 ease-out hover:translate-x-4 text-cream cursor-default">
            Heal.
          </span>
          <span className="block opacity-0 animate-slide-3 not-italic transition-all duration-300 ease-out hover:translate-x-4 text-cream cursor-default">
            Regulate.
          </span>
          <em className="block opacity-0 animate-slide-4 not-italic text-[#ad7432] transition-all duration-300 ease-out hover:translate-x-4 hover:tracking-wide cursor-default">
            Transform.
          </em>
        </h1>

        <p className="mb-[18px] max-w-[490px] font-serif text-[21px] font-medium leading-[1.3] opacity-0 animate-slide-5 max-[700px]:text-[18px] transition-all duration-300 ease-out hover:translate-x-2 text-cream cursor-default">
          Sometimes, before you can change your life, you need to feel safe enough to change.
        </p>

        <p className="max-w-[500px] text-sm leading-[1.75] text-cream opacity-0 animate-slide-6 transition-all duration-300 ease-out hover:translate-x-2 hover:text-[#3d453f] cursor-default">
          Compassionate, trauma-informed coaching to help you understand emotional patterns, regulate your inner world and create meaningful transformation.
        </p>

        <div className="flex flex-wrap gap-4 pt-10 animate-slide-4 opacity-0 transition-all duration-300 ease-out max-[700px]:pt-6">
          <a
            href="/book-session"
            className={`${buttonDark} transition-transform duration-300 hover:scale-105`}
          >
            Begin Your Journey
          </a>

          <a
            href="#practice"
            className={`${buttonLight} transition-transform duration-300 hover:scale-105`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#ad7432]">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-[1px] h-2.5 w-2.5"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            Explore the Practice
          </a>
        </div>
      </div>

      {/* Right side — image + animated glowing wave-strands radiating from head/body */}
      <div className="group absolute inset-y-0 left-1/2 right-0 overflow-hidden bg-[#0a2124]">
        <Image
          src="/images/hero_side.png"
          alt="Serene woman with a glowing neural-inspired visual"
          fill
          priority
          sizes="(max-width: 800px) 100vw, 50vw"
          className="object-center"
        />

<svg
  className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
  viewBox="0 0 100 100"
  preserveAspectRatio="none"
>
  <defs>
    <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#f2b46b" stopOpacity="1" />
      <stop offset="100%" stopColor="#f2b46b" stopOpacity="0" />
    </radialGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="0.4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <radialGradient id="faceHole" cx="22%" cy="42%" r="42%">
      <stop offset="0%" stopColor="black" />
      <stop offset="65%" stopColor="black" />
      <stop offset="100%" stopColor="white" />
    </radialGradient>
    <mask id="excludeFace" maskUnits="objectBoundingBox">
      <rect x="0" y="0" width="100" height="100" fill="white" />
      <rect x="0" y="0" width="100" height="100" fill="url(#faceHole)" />
    </mask>
  </defs>

  <g mask="url(#excludeFace)">
    <g filter="url(#softGlow)">
      {(() => {
        // Origins now sit INSIDE the head/hair mass (not just at the outer edge),
        // so lines appear to emerge from within, radiating both up/out and down into the body.
        const headOrigins = [
          // Inside the crown / upper hair mass
          { x: 45, y: 12 }, { x: 52, y: 8 }, { x: 58, y: 14 }, { x: 50, y: 18 },
          { x: 62, y: 20 }, { x: 55, y: 10 }, { x: 47, y: 22 }, { x: 60, y: 16 },
          // Inside right-side hair (mid-depth, not just the outline)
          { x: 65, y: 26 }, { x: 68, y: 32 }, { x: 63, y: 38 }, { x: 70, y: 40 },
          { x: 66, y: 44 }, { x: 60, y: 30 }, { x: 72, y: 22 }, { x: 64, y: 34 },
          // Deeper into the hair bun / back-of-head mass
          { x: 55, y: 40 }, { x: 58, y: 46 }, { x: 52, y: 44 }, { x: 62, y: 48 },
          { x: 48, y: 36 }, { x: 56, y: 34 },
        ];

        // Body origins inside the shoulder/torso mass, flowing further down/out
        const bodyOrigins = [
          { x: 50, y: 58 }, { x: 56, y: 62 }, { x: 46, y: 64 }, { x: 60, y: 60 },
          { x: 53, y: 68 }, { x: 58, y: 72 }, { x: 48, y: 70 }, { x: 63, y: 66 },
          { x: 55, y: 76 }, { x: 50, y: 78 }, { x: 62, y: 74 }, { x: 45, y: 60 },
          { x: 66, y: 58 }, { x: 68, y: 64 }, { x: 44, y: 68 }, { x: 40, y: 62 },
        ];

        const headLines = headOrigins.map((o, i) => {
          const angleBase = -30 + i * 17 + (i % 4) * 5;
          const length = 20 + (i % 5) * 5 + (i % 3) * 3;
          const amplitude = 2.5 + (i % 6) * 0.8 + (i % 4) * 0.5;
          const segments = 4 + (i % 3);
          return {
            d: makeWave(o.x, o.y, angleBase, length, amplitude, segments),
            delay: `${(i * 0.12 + (i % 5) * 0.08).toFixed(2)}s`,
            opacity: 0.45 + (i % 6) * 0.1,
            width: 0.14 + (i % 4) * 0.06,
          };
        });

        const bodyLines = bodyOrigins.map((o, i) => {
          const angleBase = 40 + i * 14 + (i % 5) * 4;
          const length = 16 + (i % 4) * 4 + (i % 3) * 3;
          const amplitude = 2.0 + (i % 5) * 0.6;
          const segments = 3 + (i % 3);
          return {
            d: makeWave(o.x, o.y, angleBase, length, amplitude, segments),
            delay: `${(i * 0.18 + 0.5 + (i % 4) * 0.12).toFixed(2)}s`,
            opacity: 0.35 + (i % 5) * 0.08,
            width: 0.12 + (i % 3) * 0.05,
          };
        });

        return [...headLines, ...bodyLines].map((line, i) => (
          <path
            key={i}
            d={line.d}
            fill="none"
            stroke="#f2b46b"
            strokeWidth={line.width}
            strokeLinecap="round"
            opacity={line.opacity}
            className="animate-neural-ray"
            style={{ animationDelay: line.delay }}
          />
        ));
      })()}

      {/* Glow nodes — inside the head mass and shoulder/torso mass */}
      {[
        { cx: 45, cy: 12, delay: "0s" }, { cx: 58, cy: 14, delay: "0.4s" },
        { cx: 62, cy: 20, delay: "0.8s" }, { cx: 65, cy: 26, delay: "1.2s" },
        { cx: 68, cy: 32, delay: "1.6s" }, { cx: 70, cy: 40, delay: "2s" },
        { cx: 55, cy: 10, delay: "0.6s" }, { cx: 50, cy: 18, delay: "1.4s" },
        { cx: 60, cy: 16, delay: "0.3s" }, { cx: 63, cy: 38, delay: "0.7s" },
        { cx: 66, cy: 44, delay: "1.1s" }, { cx: 58, cy: 46, delay: "1.5s" },
        { cx: 55, cy: 40, delay: "1.9s" }, { cx: 52, cy: 44, delay: "2.3s" },
        { cx: 62, cy: 48, delay: "0.5s" }, { cx: 56, cy: 34, delay: "0.9s" },
        { cx: 50, cy: 58, delay: "1.3s" }, { cx: 56, cy: 62, delay: "1.7s" },
        { cx: 46, cy: 64, delay: "0.2s" }, { cx: 60, cy: 60, delay: "0.6s" },
        { cx: 53, cy: 68, delay: "1.0s" }, { cx: 58, cy: 72, delay: "1.4s" },
        { cx: 48, cy: 70, delay: "1.8s" }, { cx: 63, cy: 66, delay: "2.2s" },
        { cx: 55, cy: 76, delay: "0.4s" }, { cx: 62, cy: 74, delay: "0.8s" },
        { cx: 66, cy: 58, delay: "1.2s" }, { cx: 68, cy: 64, delay: "1.6s" },
      ].map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r="0.5"
          fill="url(#pulseGlow)"
          className="animate-node-pulse"
          style={{ animationDelay: n.delay }}
        />
      ))}
    </g>
  </g>
</svg>

        {/* left-edge blend into section bg */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[18%]"
          style={{
            background:
              "linear-gradient(to right, #0a2124 0%, rgba(10,33,36,0.65) 45%, rgba(10,33,36,0) 100%)",
          }}
        />

        {/* subtle top/bottom feather */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[12%]"
          style={{ background: "linear-gradient(to bottom, #0a2124 0%, rgba(10,33,36,0) 100%)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%]"
          style={{ background: "linear-gradient(to top, #0a2124 0%, rgba(10,33,36,0) 100%)" }}
        />
      </div>

      <div className="absolute bottom-0 left-[7vw] h-px w-[86%] origin-left bg-[#d6c7b3] animate-line-grow" />

      <button
        type="button"
        aria-label="Scroll to next section"
        onClick={() =>
          document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" })
        }
        className="group/scroll absolute bottom-8 left-1/2 z-[4] flex -translate-x-1/2 flex-col items-center gap-2 opacity-0 animate-slide-7 max-[700px]:bottom-5"
      >
        <span className="relative flex h-11 w-11 animate-bounce-soft items-center justify-center rounded-full border border-[#d6c7b3] bg-cream/70 backdrop-blur-sm transition-all duration-300 group-hover/scroll:border-[#ad7432] group-hover/scroll:bg-[#ad7432] group-hover/scroll:scale-110">
          <span className="absolute inset-0 rounded-full border border-[#ad7432] animate-ring-pulse" />
          <svg
            className="h-4 w-4 text-[#59645e] transition-colors duration-300 group-hover/scroll:text-cream"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </span>
      </button>
    </section>
  );
}
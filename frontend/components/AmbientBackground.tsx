export function AmbientBackground() {
  const dots = [
    { top: "12%", left: "18%", size: 6, delay: "0s", anim: "animate-drift-1" },
    { top: "28%", left: "72%", size: 4, delay: "1.2s", anim: "animate-drift-2" },
    { top: "55%", left: "40%", size: 5, delay: "2.4s", anim: "animate-drift-3" },
    { top: "68%", left: "82%", size: 3, delay: "0.6s", anim: "animate-drift-1" },
    { top: "80%", left: "15%", size: 5, delay: "1.8s", anim: "animate-drift-2" },
    { top: "38%", left: "8%", size: 4, delay: "3s", anim: "animate-drift-3" },
    { top: "20%", left: "48%", size: 3, delay: "2s", anim: "animate-drift-1" },
    { top: "90%", left: "55%", size: 4, delay: "0.9s", anim: "animate-drift-2" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Neural connecting lines (brain-network feel) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M18,12 L72,28 L40,55 L82,68 L15,80 L8,38 L48,20 L55,90"
          fill="none"
          stroke="#ad7432"
          strokeWidth="0.15"
          strokeDasharray="2 3"
          className="animate-dash-flow"
        />
        <path
          d="M72,28 L48,20 L40,55 L8,38"
          fill="none"
          stroke="#ad7432"
          strokeWidth="0.1"
          strokeDasharray="1.5 4"
          className="animate-dash-flow"
        />
      </svg>

      {/* Glowing floating dots */}
      {dots.map((dot, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-[#ad7432] ${dot.anim} animate-glow-pulse-soft`}
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            boxShadow: "0 0 12px 4px rgba(173,116,50,0.55)",
          }}
        />
      ))}

      {/* Botanical line-art - top left */}
      <svg
        className="absolute -left-6 -top-4 h-40 w-40 opacity-[0.15] animate-sway"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 95 C50 70 45 50 20 30 M50 95 C50 65 55 45 80 25 M50 95 C48 60 48 40 48 10"
          stroke="#59645e"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M20 30 C15 25 12 18 14 10 M80 25 C85 20 88 14 86 6"
          stroke="#59645e"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>

      {/* Botanical line-art - bottom right */}
      <svg
        className="absolute -bottom-8 -right-6 h-48 w-48 opacity-[0.15] animate-sway-slow"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 95 C50 70 45 50 20 30 M50 95 C50 65 55 45 80 25 M50 95 C48 60 48 40 48 10"
          stroke="#ad7432"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
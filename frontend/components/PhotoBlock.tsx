const tones: Record<string, string> = {
  warm: "bg-[radial-gradient(circle_at_30%_20%,#fff3d6,transparent_55%),linear-gradient(135deg,#e7d9c3,#c9b79a)]",
  sage: "bg-[radial-gradient(circle_at_70%_25%,#eef3ea,transparent_55%),linear-gradient(135deg,#c7d4c5,#9fb39d)]",
  deep: "bg-[radial-gradient(circle_at_50%_20%,#3a615c,transparent_55%),linear-gradient(135deg,#0d4741,#073d38)]",
  cream: "bg-[radial-gradient(circle_at_60%_15%,#fffaf0,transparent_55%),linear-gradient(135deg,#f0e6d4,#dcc9a9)]",
  portrait: "bg-[radial-gradient(circle_at_50%_15%,#f8ecd9,transparent_50%),linear-gradient(160deg,#e3d3ba,#b79b76)]",
};

export function PhotoBlock({
  tone = "warm",
  className = "",
  icon,
  label,
}: {
  tone?: keyof typeof tones;
  className?: string;
  icon?: string;
  label?: string;
}) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${tones[tone]} ${className}`}>
      {icon && <span className="text-6xl opacity-40">{icon}</span>}
      {label && (
        <span className="absolute bottom-5 left-6 font-serif text-xl italic text-white/90 drop-shadow">
          {label}
        </span>
      )}
    </div>
  );
}

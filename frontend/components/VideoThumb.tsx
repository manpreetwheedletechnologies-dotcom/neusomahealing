export function VideoThumb({ title, duration, category }: { title: string; duration: string; category: string }) {
  return (
    <div>
      <div className="relative h-[190px] overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_60%_30%,#0d4741,transparent_55%),linear-gradient(135deg,#0a3733,#062a26)] after:absolute after:inset-0 after:bg-[linear-gradient(transparent,#082e2c66)] after:content-['']">
        <span className="absolute left-1/2 top-1/2 z-[2] grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#fff8] pl-0.5 text-[13px] text-white">
          ▶
        </span>
        <small className="absolute bottom-[10px] right-[10px] z-[2] text-[9px] text-white">{duration}</small>
      </div>
      <h3 className="mb-[5px] mt-[15px] font-serif text-2xl font-medium leading-none">{title}</h3>
      <p className="text-[10px] uppercase tracking-[.08em] text-[#8e775c]">{category}</p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["H.R.T. Framework", "/hrt-framework"],
  ["Coaching", "/coaching"],
  ["Videos", "/videos"],
  ["Insights", "/insights"],
  ["Contact", "/contact"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  // white/transparent look sirf home page ke top par; baaki hamesha dark/ink
  const isLight = !scrolled && isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); // initial check (agar page already scrolled load hua ho)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed left-1/2 top-0 z-[20000] -translate-x-1/2 font-sans",
        "flex items-center justify-between gap-8",
        "transition-[width,margin-top,padding,border-radius,background,border-color,box-shadow,backdrop-filter] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled
          ? "w-[min(1100px,92%)] mt-4 rounded-full border border-ink/15 bg-cream/[0.5] px-7 py-3 shadow-[0_8px_30px_rgba(43,36,29,0.12)] backdrop-blur-xl"
          : "w-[95%] mt-0 rounded-none border border-transparent bg-transparent px-12 py-[18px] shadow-none backdrop-blur-0",
      ].join(" ")}
    >
   <Link
  href="/"
  className="flex shrink-0 items-center text-ink no-underline"
  aria-label="NeusomaHealing Practice home"
>
  <img
    src="/no_bg_neusomalogo_1.png"
    alt="NeusomaHealing Practice — Heal. Regulate. Transform."
    className={[
      "block w-auto object-contain transition-[height] duration-300",
      scrolled ? "h-[60px]" : "h-[70px]",
    ].join(" ")}
  />
</Link>
      <nav
        className={[
          "flex flex-1 items-center justify-center gap-[30px]",
          "max-[900px]:absolute max-[900px]:left-0 max-[900px]:right-0 max-[900px]:top-[calc(100%+10px)]",
          "max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-1",
          "max-[900px]:rounded-[20px] max-[900px]:border max-[900px]:border-ink/10 max-[900px]:bg-cream max-[900px]:px-6 max-[900px]:pb-5 max-[900px]:pt-3",
          open ? "max-[900px]:flex" : "max-[900px]:hidden",
        ].join(" ")}
      >
       {links.map(([label, href]) => {
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href);

  return (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={[
        "relative whitespace-nowrap py-1.5 text-[14.5px]",
        isLight ? "text-cream" : "text-ink",
        "no-underline",
        "after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-200 hover:after:scale-x-100",
        "max-[900px]:w-full max-[900px]:py-2.5",
        isActive ? "after:scale-x-100" : "",
      ].join(" ")}
    >
      {label}
    </Link>
  );
})}
      </nav>
<Link
  href="/book-session"
  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-[22px] py-3 text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-gold-dark max-[900px]:hidden"
>
  Book a Session <span className="text-xs">↗</span>
</Link>

      <button
        className={[
          "hidden text-[22px] bg-transparent max-[900px]:block",
          isLight ? "text-cream" : "text-ink",
        ].join(" ")}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? "×" : "☰"}
      </button>
    </header>
  );
}
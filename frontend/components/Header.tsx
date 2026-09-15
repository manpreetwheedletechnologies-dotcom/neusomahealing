"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { HeaderAccountMenu } from "@/components/HeaderAccountMenu";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["H.R.T. Framework", "/hrt-framework"],
  // ["Coaching", "/coaching"],
  ["Videos", "/videos"],
  ["Blogs", "/blogs"],
  ["Contact", "/contact"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isLight = !scrolled && isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
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
            src={isLight ? "/logo_mw.png" : "/logo_m.png"}
            alt="NeusomaHealing Practice — Heal. Regulate. Transform."
            className={[
              "block w-auto object-contain transition-[height] duration-300",
              scrolled ? "h-[65px]" : "h-[90px]",
            ].join(" ")}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-[30px] min-[901px]:flex">
          {links.map(([label, href]) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={[
                  "relative whitespace-nowrap py-1.5 text-[14.5px]",
                  isLight ? "text-cream" : "text-ink",
                  "no-underline",
                  "after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-200 hover:after:scale-x-100",
                  isActive ? "after:scale-x-100" : "",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop account + CTA */}
        <HeaderAccountMenu isLight={isLight} />

        <Link
          href="/book-session"
          className="hidden shrink-0 items-center gap-1.5 rounded-full bg-gold px-[22px] py-3 text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-gold-dark min-[901px]:inline-flex"
        >
          Book a Session <span className="text-xs">↗</span>
        </Link>

        {/* Mobile hamburger */}
        <button
          className={[
            "block text-[22px] bg-transparent min-[901px]:hidden",
            isLight ? "text-cream" : "text-ink",
          ].join(" ")}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={[
          "fixed inset-0 z-[21000] bg-ink/40 backdrop-blur-sm transition-opacity duration-300 min-[901px]:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* Side drawer */}
      <aside
        className={[
          "fixed top-0 right-0 z-[22000] h-full w-[85%] max-w-[380px]",
          "flex flex-col overflow-hidden",
          "bg-cream shadow-[-12px_0_40px_rgba(43,36,29,0.18)]",
          "rounded-l-[32px] border-l border-ink/10",
          "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "min-[901px]:hidden",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Decorative gradient top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gold/15 to-transparent" />

        {/* Drawer header */}
        <div className="relative flex items-center justify-between border-b border-ink/10 px-6 pb-5 pt-8">
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-ink/50">
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[22px] leading-none text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            ×
          </button>
        </div>

        {/* Nav links */}
        <nav className="relative flex-1 overflow-y-auto px-4 py-6">
          <ul className="flex flex-col gap-1">
            {links.map(([label, href], i) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname?.startsWith(href);

              return (
                <li
                  key={href}
                  style={{
                    transitionDelay: open ? `${80 + i * 40}ms` : "0ms",
                  }}
                  className={[
                    "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open
                      ? "translate-x-0 opacity-100"
                      : "translate-x-6 opacity-0",
                  ].join(" ")}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={[
                      "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[16.5px] no-underline transition-colors duration-200",
                      isActive
                        ? "bg-gold/10 text-ink"
                        : "text-ink/80 hover:bg-ink/[0.04] hover:text-ink",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full bg-gold transition-all duration-300",
                        isActive
                          ? "scale-100 opacity-100"
                          : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-60",
                      ].join(" ")}
                    />
                    <span className="font-medium tracking-wide">{label}</span>
                    <span
                      className={[
                        "ml-auto text-xs text-gold transition-all duration-300",
                        isActive
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                      ].join(" ")}
                    >
                      ↗
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA */}
          <div
            style={{ transitionDelay: open ? "400ms" : "0ms" }}
            className={[
              "mt-8 border-t border-ink/10 px-2 pt-6",
              "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
            ].join(" ")}
          >
            <Link
              href="/book-session"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-[15px] font-medium text-white no-underline transition-all duration-300 hover:bg-gold-dark"
            >
              Book a Session <span className="text-xs">↗</span>
            </Link>

            <div className="mt-3">
              <HeaderAccountMenu
                variant="mobile"
                onNavigate={() => setOpen(false)}
              />
            </div>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.28em] text-ink/35">
              Heal · Regulate · Transform
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
}
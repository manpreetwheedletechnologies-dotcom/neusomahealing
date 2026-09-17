import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";

/* ---------- Inline brand icon components ---------- */
function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YoutubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.92 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

export function SiteFooter() {
  const socials = [
    { name: "Instagram", href: "#", Icon: InstagramIcon },
    { name: "LinkedIn", href: "#", Icon: LinkedinIcon },
    { name: "YouTube", href: "#", Icon: YoutubeIcon },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#062f2d] text-[#c4d0c8]">
      {/* Ambient premium glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[280px] w-[280px] rounded-full bg-[#b27a39]/[0.06] blur-[100px] sm:h-[360px] sm:w-[360px] md:h-[420px] md:w-[420px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[280px] w-[280px] rounded-full bg-[#b27a39]/[0.05] blur-[100px] sm:h-[360px] sm:w-[360px] md:h-[420px] md:w-[420px]" />

      <div className="relative mx-auto max-w-[1400px] px-5 pb-8 sm:px-8 sm:pt-16 md:px-[5vw] md:pb-8 md:pt-[10px]">
        {/* Main footer grid */}
        <div
          className="
            grid grid-cols-1 gap-10
            border-b border-white/[0.10] pb-12
            sm:grid-cols-2 sm:gap-10 sm:pb-14
            lg:grid-cols-[1.65fr_1fr_1fr_1.45fr] lg:gap-12 lg:pb-16
          "
        >
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1 lg:pr-10">
            <Link
              href="/"
              aria-label="NeusomaHealing Practice home"
              className="inline-flex items-center"
            >
              <img
                src="/logo_w.png"
                alt="NeusomaHealing Practice — Heal. Regulate. Transform."
                className="h-auto w-[130px] object-contain sm:w-[140px] lg:w-[150px]"
              />
            </Link>

            <p className="mt-6 max-w-[420px] text-[13px] leading-[1.9] text-[#9eb1aa] sm:mt-7 sm:text-[14px]">
              A nervous-system informed approach to healing, regulation and
              meaningful transformation — helping you reconnect with yourself
              from the inside out.
            </p>

            {/* Gold divider */}
            <div className="mt-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#b27a39]" />
              <span className="h-1 w-1 rounded-full bg-[#b27a39]" />
              <span className="h-px w-5 bg-[#b27a39]/40" />
            </div>

            {/* Socials */}
            <div className="mt-7 flex items-center gap-3">
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group flex h-10 w-10 items-center justify-center rounded-full
                    border border-[#b27a39]/30 text-[#d3a15f]
                    transition-all duration-300
                    hover:border-[#b27a39] hover:bg-[#b27a39] hover:text-white
                    hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-6px_rgba(178,122,57,0.55)]
                  "
                >
                  <Icon className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:mb-6">
              <span className="h-px w-5 bg-[#b27a39]" />
              Explore
            </h4>

            <nav className="space-y-3 sm:space-y-3.5">
              {[
                ["About", "/about"],
                ["H.R.T. Framework", "/hrt-framework"],
                ["Coaching", "/coaching"],
                ["Videos", "/videos"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center text-[12px] text-[#9eb1aa] transition-colors duration-300 hover:text-white"
                >
                  <span className="mr-2 h-px w-0 bg-[#b27a39] transition-all duration-300 group-hover:w-3" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:mb-6">
              <span className="h-px w-5 bg-[#b27a39]" />
              Resources
            </h4>

            <nav className="space-y-3 sm:space-y-3.5">
              {[
                ["Blogs", "/blogs"],
                ["Testimonials", "/testimonials"],
                ["Book a Session", "/book-session"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center text-[12px] text-[#9eb1aa] transition-colors duration-300 hover:text-white"
                >
                  <span className="mr-2 h-px w-0 bg-[#b27a39] transition-all duration-300 group-hover:w-3" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="mb-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:mb-6">
              <span className="h-px w-5 bg-[#b27a39]" />
              Stay Connected
            </h4>

            <p className="max-w-[420px] text-[12px] leading-[1.8] text-[#9eb1aa] sm:max-w-[320px]">
              Receive thoughtful insights, nervous-system education, videos
              and resources for your healing journey.
            </p>

            <NewsletterSignup />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="
            flex flex-col items-start gap-4 pt-6
            text-[9px] tracking-[0.02em] text-[#718781]
            sm:flex-row sm:items-center sm:justify-between sm:gap-0
          "
        >
          <span>© 2026 NeusomaHealing Practice. All rights reserved.</span>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <Link href="/privacy" className="transition-colors hover:text-[#b27a39]">
              Privacy
            </Link>
            <span className="h-3 w-px bg-[#49635d]" />
            <Link href="/terms" className="transition-colors hover:text-[#b27a39]">
              Terms
            </Link>
            <span className="h-3 w-px bg-[#49635d]" />
            <Link href="/disclaimer" className="transition-colors hover:text-[#b27a39]">
              Disclaimer
            </Link>
          </div>
        </div>

        {/* Site credit */}
        <div className="mt-6 flex justify-center">
          <a
            href="https://www.wheedletechnologies.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="
              group inline-flex items-center gap-2 rounded-full
              border border-[#b27a39]/25 bg-white/[0.03] px-4 py-2
              text-[10px] tracking-[0.05em] text-[#9eb1aa]
              backdrop-blur-sm transition-all duration-300
              hover:border-[#b27a39]/60 hover:bg-[#b27a39]/[0.08] hover:text-white
              hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-6px_rgba(178,122,57,0.35)]
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#b27a39] transition-transform duration-300 group-hover:scale-125" />
            <span>
              Website crafted by{" "}
              <span className="font-semibold text-[#d3a15f] transition-colors duration-300 group-hover:text-[#e8b876]">
                Wheedle Technologies
              </span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
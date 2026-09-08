import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#062f2d] text-[#c4d0c8]">
      {/* Ambient premium glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#b27a39]/[0.06] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-[#b27a39]/[0.05] blur-[100px]" />

      <div className="relative mx-auto max-w-[1400px] px-[5vw] pb-8 pt-[80px]">
        {/* Main footer */}
        <div className="grid grid-cols-[1.65fr_1fr_1fr_1.45fr] gap-12 border-b border-white/[0.10] pb-16 max-[1000px]:grid-cols-2 max-[700px]:gap-10 max-[700px]:pt-[60px]">

          {/* Brand */}
          <div className="pr-10 max-[1000px]:pr-0">
            <Link
  href="/"
  aria-label="NeusomaHealing Practice home"
  className="inline-flex items-center"
>
  <img
    src="/no_bg_neusomalogo_1.png"
    alt="NeusomaHealing Practice — Heal. Regulate. Transform."
    className="h-auto w-[150px] object-contain max-[700px]:w-[120px]"
  />
</Link>

            <p className="mt-7 max-w-[350px] text-[14px] leading-[1.9] text-[#9eb1aa]">
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
              {["IG", "LI", "YT"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#b27a39]/30 text-[9px] font-medium tracking-[0.08em] text-[#d3a15f] transition-all duration-300 hover:border-[#b27a39] hover:bg-[#b27a39] hover:text-white"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white">
              <span className="h-px w-5 bg-[#b27a39]" />
              Explore
            </h4>

            <nav className="space-y-3.5">
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
            <h4 className="mb-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white">
              <span className="h-px w-5 bg-[#b27a39]" />
              Resources
            </h4>

            <nav className="space-y-3.5">
              {[
                ["Insights", "/insights"],
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
          <div>
            <h4 className="mb-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white">
              <span className="h-px w-5 bg-[#b27a39]" />
              Stay Connected
            </h4>

            <p className="max-w-[320px] text-[12px] leading-[1.8] text-[#9eb1aa]">
              Receive thoughtful insights, nervous-system education, videos
              and resources for your healing journey.
            </p>

            {/* Newsletter box */}
            <div className="mt-6 rounded-[18px] border border-white/[0.10] bg-white/[0.035] p-2 backdrop-blur-sm">
              <div className="flex items-center">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[11px] text-white outline-none placeholder:text-[#7f9690]"
                />

                <button
                  type="button"
                  aria-label="Subscribe"
                  className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#b27a39] text-white shadow-[0_8px_25px_rgba(178,122,57,0.18)] transition-all duration-300 hover:bg-[#c48b48] hover:shadow-[0_10px_30px_rgba(178,122,57,0.3)]"
                >
                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
              </div>
            </div>

            <p className="mt-3 px-1 text-[9px] leading-relaxed text-[#718781]">
              No noise. Just meaningful resources. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-6 text-[9px] tracking-[0.02em] text-[#718781] max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-4">
          <span>
            © 2026 NeusomaHealing Practice. All rights reserved.
          </span>

          <div className="flex items-center gap-5 max-[700px]:gap-4">
            <Link
              href="/privacy"
              className="transition-colors hover:text-[#b27a39]"
            >
              Privacy
            </Link>

            <span className="h-3 w-px bg-[#49635d]" />

            <Link
              href="/terms"
              className="transition-colors hover:text-[#b27a39]"
            >
              Terms
            </Link>

            <span className="h-3 w-px bg-[#49635d]" />

            <Link
              href="/disclaimer"
              className="transition-colors hover:text-[#b27a39]"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
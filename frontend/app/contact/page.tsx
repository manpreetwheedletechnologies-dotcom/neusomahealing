import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { contactInfo } from "@/lib/site-data";
import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";

export const metadata = { title: "Contact — NeusomaHealing Practice" };

const details = [
  ["Email", contactInfo.email],
  ["Phone", contactInfo.phone],
  ["Location", contactInfo.location],
] as const;

const socials = ["◎", "f", "in", "▶"];

export default function ContactPage() {
  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      <section className={`grid grid-cols-[0.8fr_1.2fr] gap-[60px] bg-cream ${sectionPadTop} max-[900px]:grid-cols-1`}>
        <Reveal>
          <p className={eyebrow}>GET IN TOUCH</p>
          <h1 className="m-0 mb-5 font-serif text-[clamp(34px,4vw,50px)] font-medium leading-[1.05]">
            Let&apos;s Start a Conversation
          </h1>
          <p className="mb-8 max-w-[380px] text-sm leading-[1.8] text-[#59645e]">
            I&apos;d love to hear from you. Whether you have a question or are ready to begin your journey, I&apos;m here for you.
          </p>
          <div className="space-y-5">
            {details.map(([label, value]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0e2c9] text-sm text-[#8b632f]">●</span>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
                  <p className="text-sm text-ink">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="mb-3 text-[11px] uppercase tracking-wide text-muted">Follow</p>
            <div className="flex gap-3">
              {socials.map((s, i) => (
                <span key={i} className="grid h-8 w-8 place-items-center rounded-full border border-line text-xs text-ink">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <form className="relative space-y-4 overflow-hidden rounded-[22px] border border-line bg-[#fffaf3] p-8">
            <input
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-muted"
              placeholder="Your Name"
            />
            <input
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-muted"
              placeholder="Email Address"
            />
            <input
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-muted"
              placeholder="Phone Number"
            />
            <input
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-muted"
              placeholder="Subject"
            />
            <textarea
              className="h-32 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none placeholder:text-muted"
              placeholder="Your Message"
            />
            <button type="button" className={`${buttonDark} w-full justify-center py-4`}>
              Send Message
            </button>
          </form>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}

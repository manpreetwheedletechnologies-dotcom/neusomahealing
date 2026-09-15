import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { contactInfo } from "@/lib/site-data";
import { eyebrow, sectionPadTop } from "@/lib/ui";
import { ContactForm } from "@/components/ContactForm";
import { LeafBranch } from "@/components/LeafBranch";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = { title: "Contact — NeusomaHealing Practice" };

const details = [
  { label: "Email", value: contactInfo.email, Icon: Mail },
  { label: "Phone", value: contactInfo.phone, Icon: Phone },
  { label: "Location", value: contactInfo.location, Icon: MapPin },
] as const;

// lucide-react no longer ships brand/logo icons, so these are small inline SVGs
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
      <path d="M13.5 21v-8.2h2.75l.41-3.2h-3.16V7.5c0-.93.26-1.56 1.59-1.56h1.7V3.1C15.9 3.03 15.03 3 14 3c-2.5 0-4.2 1.53-4.2 4.34v2.26H7v3.2h2.8V21h3.7z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.86-3.06-1.87 0-2.16 1.46-2.16 2.96V21H9z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
      <path d="M21.6 7.2s-.21-1.5-.86-2.16c-.82-.87-1.74-.87-2.16-.92C15.6 4 12 4 12 4s-3.6 0-6.58.12c-.42.05-1.34.05-2.16.92C2.61 5.7 2.4 7.2 2.4 7.2S2.18 8.95 2.18 10.7v1.6c0 1.75.22 3.5.22 3.5s.21 1.5.86 2.16c.82.87 1.9.84 2.38.93C7.4 20 12 20 12 20s3.6 0 6.58-.12c.42-.05 1.34-.05 2.16-.92.65-.66.86-2.16.86-2.16s.22-1.75.22-3.5v-1.6c0-1.75-.22-3.5-.22-3.5zM9.95 14.5V8.9l5.4 2.8-5.4 2.8z" />
    </svg>
  );
}

const socials = [GlobeIcon, FacebookIcon, LinkedinIcon, InstagramIcon, YoutubeIcon];

export default function ContactPage() {
  return (
    <main className="bg-paper font-sans text-ink">
      <section
        className={`grid min-h-screen grid-cols-[0.8fr_1.2fr] gap-[60px] overflow-hidden bg-cream pb-24 ${sectionPadTop} relative max-[900px]:grid-cols-1`}
      >
        <Reveal>
          <h1 className="m-0 mb-5 font-serif text-[clamp(34px,4vw,50px)] font-medium leading-[1.05] text-[#1c3a30]">
            Let&apos;s Start a Conversation
          </h1>
          <p className="mb-8 max-w-[380px] text-base leading-[1.7] text-[#4b564f]">
            Fill out the form here if you would like to have a discussion or
            any needs to begin your journey. I&apos;m here for you.
          </p>

          <div className="space-y-5">
            {details.map(({ label, value, Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#c99a3a] text-white">
                  <Icon size={19} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#1c3a30]">
                    {label}
                  </p>
                  <p className="text-sm text-[#4b564f]">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-[#1c3a30]">
              Follow
            </p>
            <div className="flex gap-3">
              {socials.map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[#1c3a30] text-white"
                >
                  <Icon />
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="relative">
            <LeafBranch className="pointer-events-none absolute bottom-0 right-0 z-20 h-[580px] w-[440px] translate-y-[21%] translate-x-[15%] opacity-50 max-[900px]:hidden" />
            <div className="relative z-10">
              <ContactForm />
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
// Shared Tailwind utility strings so every inner page stays visually
// consistent with the homepage without repeating long class lists everywhere.

export const sectionPad = "px-[max(5vw,32px)] py-[110px] max-[700px]:px-6 max-[700px]:py-20";
export const sectionPadTop =
  "px-[max(5vw,32px)] pb-[110px] pt-[170px] max-[700px]:px-6 max-[700px]:pb-20 max-[700px]:pt-[135px]";
export const eyebrow = "mb-5 text-[11px] font-semibold tracking-[.22em] text-[#8d775f]";
export const heading =
  "font-serif text-[clamp(42px,5vw,72px)] font-medium leading-[.92] tracking-[-.035em] text-ink";
export const headingSm =
  "font-serif text-[clamp(32px,3.6vw,48px)] font-medium leading-[1] tracking-[-.02em] text-ink";
export const sectionIntro = "mx-auto mb-[50px] mt-5 max-w-[620px] text-muted";

export const buttonBase =
  "inline-flex items-center gap-3 rounded-full px-[22px] py-[13px] text-xs font-semibold transition-transform duration-300 hover:-translate-y-0.5";
export const buttonDark = `${buttonBase} bg-deep text-white`;
export const buttonLight = `${buttonBase} border border-[#bfae98] text-ink`;
export const buttonGold = `${buttonBase} bg-[#b37a37] text-white hover:bg-[#8d5d26]`;
export const buttonOutline = `${buttonBase} border border-[#b79b76] text-white`;

export const textLink =
  "mt-4 inline-flex items-center gap-3 border-b border-[#a98963] pb-[7px] text-xs font-semibold text-ink";

export const pill =
  "rounded-full border border-[#dfd2c0] px-4 py-2 text-xs font-medium text-ink transition-colors duration-200 hover:border-gold";
export const pillActive = "rounded-full bg-deep px-4 py-2 text-xs font-medium text-white";

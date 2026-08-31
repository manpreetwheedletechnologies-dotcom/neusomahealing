import Image from "next/image";
import { buttonGold, buttonOutline } from "@/lib/home-styles";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#062d2b] text-white">
      <div className="mx-auto grid min-h-[150px] max-w-[1320px] grid-cols-[34%_41%_25%] items-center max-[900px]:grid-cols-[32%_68%] max-[700px]:grid-cols-1">

        {/* LEFT IMAGE */}
        <div className="relative h-[150px] overflow-hidden max-[700px]:h-[220px]">
          <Image
            src="/images/cta-woman-image.png"
            alt=""
            fill
            sizes="34vw"
            className="object-cover object-center"
            priority
          />

          {/* Dark teal blend */}
          <div className="absolute inset-0 bg-[#062d2b]/35" />

          {/* Fade image into center */}
          <div className="absolute inset-y-0 right-0 w-[45%] bg-gradient-to-r from-transparent to-[#062d2b]" />

          {/* Slight left vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#062d2b]/30 via-transparent to-transparent" />
        </div>

        {/* CENTER TEXT */}
        <div className="relative z-[2] px-[28px] max-[900px]:px-[24px] max-[700px]:py-[35px]">
          <h2 className="m-0 font-serif text-[24px] font-medium leading-[1.08] tracking-[-0.02em] text-[#f4e6cf] max-[1100px]:text-[21px] max-[700px]:text-[25px]">
            Heal what needs compassion.
            <br />
            Regulate what needs safety.
            <br />
            <i className="not-italic">
              Transform what is ready to change.
            </i>
          </h2>
        </div>

        {/* BUTTONS */}
        <div className="relative z-[2] flex flex-col gap-[8px] px-[24px] max-[900px]:items-start max-[700px]:pb-[35px]">
          <a
            href="/book-session"
            className="flex h-[38px] w-[178px] items-center justify-center rounded-full bg-[#fff4df] px-[18px] text-[10px] font-semibold text-[#654a2d] transition hover:bg-white"
          >
            Begin Your Journey
            <span className="ml-[8px]">↗</span>
          </a>

          <a
            href="/book-session"
            className="flex h-[38px] w-[178px] items-center justify-center rounded-full border border-[#c9a873] bg-transparent px-[18px] text-[10px] font-semibold text-[#f7ead6] transition hover:bg-[#c9a873] hover:text-[#18302d]"
          >
            Book a Session
          </a>
        </div>
      </div>

      {/* LOTUS DECORATION */}
      <div className="pointer-events-none absolute right-[3%] top-1/2 hidden -translate-y-1/2 opacity-[0.28] min-[900px]:block">
        <Image
          src="/images/cta-lotus-decoration.png"
          alt=""
          width={180}
          height={180}
          className="h-[150px] w-[150px] object-contain min-[1200px]:h-[180px] min-[1200px]:w-[180px]"
        />
      </div>
    </section>
  );
}
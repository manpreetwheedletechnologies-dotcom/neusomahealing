import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { coaching } from "@/lib/home-data";
import { buttonLight, eyebrow, heading, sectionPad } from "@/lib/home-styles";

export function CoachingSection() {
  return (
    <section className={`bg-[#f4ede2] ${sectionPad}`}>
      <Reveal className="mb-[18px] flex items-end justify-between gap-10 max-[700px]:block">
        <div>
          <p className={eyebrow}>COACHING</p>

          <h2
            className={`${heading} !text-[48px] !leading-[1.08] max-[700px]:!text-[28px]`}
          >
            Change becomes easier
            ,
            when you don&apos;t have to
            <br />
            <i className="not-italic">do it alone.</i>
          </h2>
        </div>

        <a
          className={`${buttonLight} max-[700px]:mt-[25px]`}
          href="/coaching"
        >
          Explore All Coaching Options
          <span>→</span>
        </a>
      </Reveal>

      <div className="grid grid-cols-4 gap-[28px] max-[1000px]:grid-cols-2 max-[700px]:grid-cols-1">
        {coaching.map((item) => (
          <Reveal
            key={item.title}
            className="overflow-hidden rounded-[16px] border border-[#dfd2c0] bg-[#fffaf3]"
          >
            {/* IMAGE */}
            <div className="relative h-[103px] overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 25vw"
                className="object-cover"
              />
            </div>

            {/* CONTENT */}
            <div className="px-[24px] py-[12px]">
              <h3 className="m-0 mb-[12px] font-serif text-[18px] font-medium leading-[1.15] text-[#111]">
                {item.title}
              </h3>

              <p className="mb-[12px] min-h-[58px] text-[12px] leading-[1.45] text-[#55504a]">
                {item.text}
              </p>

              <a
                className="text-[11px] font-semibold text-[#8b632f] transition hover:underline"
                href="/coaching"
              >
                Learn more <span>→</span>
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
import { Reveal } from "@/components/Reveal";
import { testimonials } from "@/lib/home-data";

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-[#f4ede2] px-[max(6vw,40px)] py-[72px] max-[700px]:px-6 max-[700px]:py-14">
      <div className="mx-auto max-w-[1180px]">

        {/* HEADING */}
        <Reveal>
          <h2 className="mb-[28px] font-serif text-[48px] font-medium leading-[1.1] tracking-[-0.02em] text-[#171717] max-[700px]:text-[25px]">
            Real journeys. Real transformation.
          </h2>
        </Reveal>

        {/* CARDS */}
        <div className="grid grid-cols-4 gap-[18px] max-[1050px]:grid-cols-2 max-[600px]:grid-cols-1">

          {testimonials.slice(0, 3).map(([name, type, quote]) => (
            <Reveal key={name}>
              <article className="group flex min-h-[190px] flex-col justify-between rounded-[15px] border border-[#e3d7c6] bg-[#fffaf3] px-[21px] py-[19px] shadow-[0_5px_20px_rgba(94,70,40,0.04)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_12px_30px_rgba(94,70,40,0.09)]">

                {/* QUOTE */}
                <div>
                  <div className="mb-[3px] font-serif text-[27px] leading-none text-[#b1834b]">
                    “
                  </div>

                  <p className="font-sans text-[11px] leading-[1.5] text-[#504b45]">
                    {quote}
                  </p>
                </div>

                {/* PERSON */}
                <div className="mt-[17px] flex items-center gap-[10px]">
                  <div className="relative grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#c4ad8c] font-serif text-[16px] text-white ring-[3px] ring-[#f0e5d7]">
                    {name.charAt(0)}
                  </div>

                  <div className="leading-none">
                    <strong className="block text-[11px] font-semibold text-[#222]">
                      {name}
                    </strong>

                    <span className="mt-[4px] block text-[9px] text-[#8c7963]">
                      {type}
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}

          {/* CTA */}
          <Reveal>
            <article className="relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[15px] bg-[#0d302d] px-[23px] py-[21px] shadow-[0_8px_25px_rgba(13,48,45,0.12)]">

              {/* Decorative glow */}
              <div className="pointer-events-none absolute -right-[35px] -top-[45px] h-[130px] w-[130px] rounded-full bg-[#c49455]/15 blur-[3px]" />

              <div className="relative z-[1]">
                <h3 className="max-w-[180px] font-serif text-[25px] font-medium leading-[1.03] tracking-[-0.02em] text-[#fffaf3]">
                  Ready to begin
                  <br />
                  your journey?
                </h3>

                <p className="mt-[14px] max-w-[175px] text-[10px] leading-[1.45] text-[#e4ddd2]">
                  You don&apos;t have to fight yourself
                  <br />
                  to change yourself.
                </p>
              </div>

              <a
                href="/contact"
                className="group relative z-[1] mt-[16px] flex h-[39px] items-center justify-between rounded-full bg-[#fffaf3] px-[14px] text-[10px] font-semibold text-[#292621] transition-all duration-300 hover:bg-[#f4eadc]"
              >
                <span>Book a Session</span>

                <span className="grid h-[25px] w-[25px] place-items-center rounded-full border border-[#d7cbb9] text-[13px] transition-transform duration-300 group-hover:translate-x-[2px]">
                  →
                </span>
              </a>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
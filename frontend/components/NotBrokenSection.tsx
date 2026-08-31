import { Reveal } from "@/components/Reveal";
import { eyebrow, heading, textLink } from "@/lib/home-styles";

export function NotBrokenSection() {
  return (
    <section className="relative overflow-hidden bg-[#f2ece2] px-[max(5vw,32px)] py-[110px] max-[700px]:px-6 max-[700px]:py-20">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[0.9fr_1.1fr] items-center gap-[70px] max-[1000px]:grid-cols-2 max-[700px]:grid-cols-1 max-[700px]:gap-12">

        {/* LEFT */}
        <Reveal className="relative z-10 max-w-[570px]">
          <div className="mb-6 flex items-center gap-3">
            <p className={eyebrow}>
              A DIFFERENT WAY TO SEE YOURSELF
            </p>

            <span className="h-px w-[55px] bg-[#bd8747]" />
            <span className="text-[#bd8747]">✦</span>
          </div>

          <h2
            className={`${heading} mb-7 text-[clamp(52px,5.2vw,82px)] leading-[0.98] tracking-[-0.045em]`}
          >
            You are
            <br />
            not{" "}
            <i className="not-italic text-[#b97932]">
              broken.
            </i>
          </h2>

          <div className="mb-8 flex items-center">
            <div className="h-px w-[360px] max-w-full bg-[#bd874755]" />
            <div className="ml-[-8px] bg-[#f3eadf] pl-2 text-[#bd8747]">
              ❧
            </div>
          </div>

          <div className="space-y-4 text-[17px] leading-[1.7] text-[#665f56]">
            <p className="max-w-[530px]">
              Your thoughts, emotions, reactions and behaviours often make
              sense when viewed through the experiences that shaped you.
            </p>

            <p className="max-w-[530px]">
              The work is not to fight yourself. It is to understand the
              pattern, regulate the system and create new choices.
            </p>
          </div>

          <a
            href="/about"
            className={`${textLink} mt-8 inline-flex items-center gap-3 border-b border-[#b77b38] pb-2 font-medium`}
          >
            Discover the philosophy
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </Reveal>


        {/* RIGHT VISUAL */}
        <Reveal className="relative flex min-h-[600px] items-center justify-center max-[700px]:min-h-[460px]">

          {/* Soft organic background */}
          <div
            className="
              absolute
              h-[530px] w-[530px]
              rounded-full
              bg-[#d6dfd1]/80
              blur-[1px]
              animate-pulse
              max-[700px]:h-[370px]
              max-[700px]:w-[370px]
            "
          />

          {/* Warm healing glow */}
          <div
            className="
              absolute
              h-[380px] w-[380px]
              rounded-full
              bg-[#e7b96f]/35
              blur-[65px]
              animate-pulse
              max-[700px]:h-[270px]
              max-[700px]:w-[270px]
            "
          />

          {/* Outer rotating ring */}
          <div
            className="
              absolute
              h-[510px] w-[510px]
              rounded-full
              border
              border-[#bd874766]
              animate-spin
              [animation-duration:35s]
              max-[700px]:h-[370px]
              max-[700px]:w-[370px]
            "
          />

          {/* Reverse-looking dashed ring */}
          <div
            className="
              absolute
              h-[450px] w-[450px]
              rounded-full
              border
              border-dashed
              border-[#bd874755]
              animate-spin
              [animation-duration:50s]
              max-[700px]:h-[330px]
              max-[700px]:w-[330px]
            "
          />

          {/* Inner ring */}
          <div
            className="
              absolute
              h-[380px] w-[380px]
              rounded-full
              border
              border-[#c99a5c44]
              max-[700px]:h-[280px]
              max-[700px]:w-[280px]
            "
          />


          {/* =========================
    HUMAN + BRAIN IMAGE
========================== */}
          <div
            className="
    relative
    z-20
    flex
    h-[500px]
    w-[500px]
    items-center
    justify-center
    max-[700px]:h-[350px]
    max-[700px]:w-[350px]
  "
          >
<img
  src="/images/neusoma-brain-healing.png"
  alt="Meditating human silhouette with glowing brain representing healing"
  className="
    relative
    z-20
    h-full
    w-full
    object-contain
    object-center
    drop-shadow-[0_25px_45px_rgba(70,55,40,0.16)]

    [mask-image:linear-gradient(to_bottom,black_55%,black_70%,rgba(0,0,0,0.45)_82%,transparent_92%)]
    [-webkit-mask-image:linear-gradient(to_bottom,black_55%,black_70%,rgba(0,0,0,0.45)_82%,transparent_92%)]
  "
/>

            {/* Brain glow */}
            <div
              className="
      pointer-events-none
      absolute
      left-[50%]
      top-[23%]
      z-10
      h-[130px]
      w-[130px]
      -translate-x-1/2
      rounded-full
      bg-[#ffbd58]/30
      blur-[45px]
      animate-pulse
    "
            />
          </div>


          {/* FLOATING ORBS */}

          <div
            className="
              absolute
              left-[5%]
              top-[24%]
              z-30
              h-10 w-10
              rounded-full
              border
              border-[#bd874788]
              bg-[#f6dcae55]
              shadow-[0_0_25px_rgba(203,148,67,0.3)]
              animate-bounce
              [animation-duration:4s]
            "
          />

          <div
            className="
              absolute
              right-[7%]
              top-[17%]
              z-30
              h-6 w-6
              rounded-full
              bg-[#d29a4c]/70
              shadow-[0_0_25px_rgba(210,154,76,0.5)]
              animate-pulse
            "
          />

          <div
            className="
              absolute
              right-[4%]
              bottom-[28%]
              z-30
              h-8 w-8
              rounded-full
              border
              border-[#78918788]
              bg-[#dce5dc55]
              animate-bounce
              [animation-duration:5s]
            "
          />


          {/* FLOATING SPARKLES */}

          <span
            className="
              absolute left-[13%] top-[37%] z-40
              text-xl text-[#c18a43]
              animate-pulse
            "
          >
            ✦
          </span>

          <span
            className="
              absolute right-[13%] top-[40%] z-40
              text-2xl text-[#c18a43]
              animate-pulse
              [animation-delay:700ms]
            "
          >
            ✦
          </span>

          <span
            className="
              absolute left-[25%] bottom-[18%] z-40
              text-sm text-[#c18a43]
              animate-pulse
              [animation-delay:1000ms]
            "
          >
            ✦
          </span>

          <span
            className="
              absolute right-[21%] bottom-[15%] z-40
              text-lg text-[#c18a43]
              animate-pulse
              [animation-delay:500ms]
            "
          >
            ✦
          </span>


          {/* GLASS INNER CLARITY CARD */}

          <div
            className="
              absolute
              right-[4%]
              bottom-[13%]
              z-40
              flex
              h-[145px] w-[145px]
              items-center justify-center
              rounded-full
              border
              border-[#78918788]
              bg-[#f4eee455]
              text-center
              shadow-[0_10px_40px_rgba(50,70,60,0.08)]
              backdrop-blur-md
              animate-bounce
              [animation-duration:6s]
              max-[700px]:h-[105px]
              max-[700px]:w-[105px]
            "
          >
            <div>
              <div className="mb-1 text-2xl text-[#bd8747]">
                ✦
              </div>

              <div className="font-serif text-[17px] italic leading-tight text-[#31564d]">
                Inner
                <br />
                clarity
              </div>
            </div>
          </div>


          {/* QUOTE */}

          <div
            className="
              absolute
              bottom-[18px]
              right-[20%]
              z-50
              font-serif
              text-[25px]
              italic
              leading-[1.05]
              text-[#31564d]
              max-[700px]:right-[10%]
              max-[700px]:text-[19px]
            "
          >
            Understanding
            <br />
            creates choice
          </div>

        </Reveal>
      </div>

      {/* DOT PATTERN */}
      <div
        className="
          pointer-events-none
          absolute bottom-0 left-0
          h-[100px] w-[210px]
          opacity-40
          [background-image:radial-gradient(#789187_1.3px,transparent_1.3px)]
          [background-size:12px_12px]
          max-[700px]:hidden
        "
      />
    </section>
  );
}
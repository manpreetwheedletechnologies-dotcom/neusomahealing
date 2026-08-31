"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const ease = [0.22, 1, 0.36, 1] as const;

export function PauseSection() {
  return (
    <section
      id="practice"
      className="
        relative
        h-[320px]
        min-h-[320px]
        w-full
        overflow-hidden
        bg-[#f2ece2]
        p-0
        m-0
        max-[900px]:h-[350px]
        max-[900px]:min-h-[350px]
        max-[700px]:h-auto
        max-[700px]:min-h-0
      "
    >
      {/* =====================================================
          SOFT CENTER GLOW
      ====================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          left-[54%]
          top-1/2
          h-[330px]
          w-[330px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#dbe8e0]
          blur-[90px]
        "
        animate={{
          scale: [0.92, 1.08, 0.92],
          opacity: [0.16, 0.28, 0.16],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =====================================================
          MAIN HORIZONTAL CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-[2]
          mx-auto
          flex
          h-full
          w-full
          max-w-[1360px]
          items-center
          px-[5.5vw]
          max-[900px]:px-[4vw]
          max-[700px]:h-auto
          max-[700px]:flex-col
          max-[700px]:gap-[45px]
          max-[700px]:py-[55px]
        "
      >

        {/* ===================================================
            LEFT — HEADING + DESCRIPTION
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            x: -35,
          }}
          whileInView={{
            opacity: 1,
            x: 0,
          }}
          viewport={{
            once: true,
            amount: 0.35,
          }}
          transition={{
            duration: 0.9,
            ease,
          }}
          className="
            w-[43%]
            shrink-0
            pr-[30px]
            max-[900px]:w-[42%]
            max-[700px]:w-full
            max-[700px]:pr-0
          "
        >
          <motion.h2
            initial={{
              opacity: 0,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.8,
              ease,
            }}
            className="
              m-0
              whitespace-nowrap
              font-serif
              text-[clamp(38px,3.35vw,50px)]
              font-medium
              leading-[0.98]
              tracking-[-0.04em]
              text-[#19302e]
              max-[1100px]:text-[38px]
              max-[900px]:whitespace-normal
              max-[700px]:text-[42px]
            "
          >
            Before you change,{" "}
            <span className="text-[#ad7638]">
              pause.
            </span>
          </motion.h2>

          <motion.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease,
            }}
            className="
              mt-[18px]
              max-w-[500px]
              text-[14px]
              leading-[1.55]
              text-[#59645e]
              max-[1100px]:text-[13px]
            "
          >
            You don&apos;t have to force yourself into transformation.
            Sometimes the first step is simply creating enough safety
            to notice what is happening within you.
          </motion.p>
        </motion.div>


        {/* ===================================================
            CENTER — BREATHING EXPERIENCE
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.82,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
            amount: 0.35,
          }}
          transition={{
            duration: 1.1,
            delay: 0.1,
            ease,
          }}
          className="
            relative
            flex
            h-[260px]
            w-[260px]
            shrink-0
            items-center
            justify-center
            max-[1100px]:h-[225px]
            max-[1100px]:w-[225px]
            max-[700px]:h-[240px]
            max-[700px]:w-[240px]
          "
        >

          {/* Large soft breathing glow */}

          <motion.div
            className="
              absolute
              h-[235px]
              w-[235px]
              rounded-full
              bg-[#dbe8e0]
              blur-[35px]
            "
            animate={{
              scale: [0.84, 1.1, 0.84],
              opacity: [0.18, 0.42, 0.18],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Outer circle */}

          <motion.div
            className="
              absolute
              h-[205px]
              w-[205px]
              rounded-full
              border
              border-[#cbdad3]
              bg-[#f7f5ef]/35
            "
            animate={{
              scale: [1, 1.06, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner ring */}

          <motion.div
            className="
              absolute
              flex
              h-[82px]
              w-[82px]
              items-center
              justify-center
              rounded-full
              border
              border-[#91b4aa]
            "
            animate={{
              scale: [0.86, 1.1, 0.86],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="
                h-[30px]
                w-[30px]
                rounded-full
                bg-[#58a39a]
                shadow-[0_0_30px_rgba(88,163,154,0.45)]
              "
              animate={{
                scale: [0.7, 1.2, 0.7],
                opacity: [0.65, 1, 0.65],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* INHALE */}

          <motion.span
            className="
              absolute
              top-[37px]
              text-[10px]
              font-medium
              uppercase
              tracking-[0.12em]
              text-[#59645e]
            "
            animate={{
              opacity: [0.45, 1, 0.45],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Inhale
          </motion.span>

          {/* EXHALE */}

          <motion.span
            className="
              absolute
              bottom-[37px]
              text-[10px]
              font-medium
              uppercase
              tracking-[0.12em]
              text-[#59645e]
            "
            animate={{
              opacity: [1, 0.45, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Exhale
          </motion.span>
        </motion.div>


        {/* ===================================================
            RIGHT — LEAF + CARD
        ==================================================== */}

        <div
          className="
            relative
            flex
            h-full
            flex-1
            items-center
            justify-end
            min-w-0
          "
        >

          {/* Botanical illustration */}

          <motion.div
            initial={{
              opacity: 0,
              x: 25,
              rotate: 2,
            }}
            whileInView={{
              opacity: 0.78,
              x: 0,
              rotate: 0,
            }}
            viewport={{
              once: true,
              amount: 0.35,
            }}
            transition={{
              duration: 1,
              delay: 0.3,
              ease,
            }}
            animate={{
              y: [0, -5, 0],
            }}
className="
  absolute
  right-[210px]
  top-[2%]
  z-[1]
  w-[205px]
  -translate-y-1/2
  max-[1100px]:right-[165px]
  max-[1100px]:w-[125px]
"
          >
            <Image
              src="/images/neusoma-pause-botanical.png"
              alt=""
              width={265}
              height={300}
              className="
                h-auto
                w-full
                object-contain
              "
            />
          </motion.div>


          {/* Take a moment card */}

          <motion.div
            initial={{
              opacity: 0,
              x: 25,
              y: 5,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.35,
            }}
            transition={{
              duration: 0.85,
              delay: 0.4,
              ease,
            }}
            whileHover={{
              y: -4,
            }}
            className="
              relative
              z-[2]
              w-[215px]
              rounded-[15px]
              border
              border-[#e1d8ca]
              bg-[#faf8f3]/95
              px-[24px]
              py-[20px]
              shadow-[0_14px_38px_rgba(106,96,64,0.09)]
              backdrop-blur-sm
              max-[1100px]:w-[190px]
              max-[1100px]:px-[20px]
            "
          >
            <span
              className="
                mb-[9px]
                block
                text-[9px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-[#927552]
              "
            >
              Take a moment
            </span>

            <p
              className="
                m-0
                font-serif
                text-[19px]
                font-medium
                leading-[1.12]
                tracking-[-0.015em]
                text-[#172c2a]
                max-[1100px]:text-[17px]
              "
            >
              Breathe in.
              <br />
              Breathe out.
              <br />
              Come back to yourself.
            </p>
          </motion.div>
        </div>
      </div>

      {/* =====================================================
          VERY SUBTLE BOTTOM BORDER
      ====================================================== */}

      <motion.div
        initial={{
          scaleX: 0,
        }}
        whileInView={{
          scaleX: 1,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          duration: 1.4,
          ease,
        }}
        className="
          absolute
          bottom-0
          left-0
          h-px
          w-full
          origin-left
          bg-[#ded3c3]
        "
      />
    </section>
  );
}
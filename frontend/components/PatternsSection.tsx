"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Heart,
  CircleAlert,
  PersonStanding,
  UserRound,
  UsersRound,
  BadgeAlert,
  CircleUserRound,
  Sprout,
} from "lucide-react";

const patterns = [
  {
    title: "Overthinking",
    icon: Brain,
  },
  {
    title: "Self-doubt",
    icon: Heart,
  },
  {
    title: "Fear",
    icon: CircleAlert,
  },
  {
    title: "Emotional",
    secondLine: "overwhelm",
    icon: PersonStanding,
  },
  {
    title: "Burnout",
    icon: UserRound,
  },
  {
    title: "People-pleasing",
    icon: UsersRound,
  },
  {
    title: "Limiting beliefs",
    icon: BadgeAlert,
  },
  {
    title: "Automatic",
    secondLine: "reactions",
    icon: CircleUserRound,
  },
  {
    title: "Life",
    secondLine: "transitions",
    icon: Sprout,
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function PatternsSection() {
  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#faf8f3]
        px-[5vw]
        pb-[38px]
        pt-[62px]
        max-[900px]:px-[4vw]
        max-[700px]:px-5
      "
    >
      {/* =====================================================
          SUBTLE BACKGROUND GLOW
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[-100px]
          right-[-80px]
          h-[260px]
          w-[260px]
          rounded-full
          bg-[#efe4d2]
          opacity-40
          blur-[90px]
        "
      />

      {/* =====================================================
          INTRO
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.3,
        }}
        transition={{
          duration: 0.8,
          ease,
        }}
        className="
          relative
          z-[2]
          mx-auto
          max-w-[1050px]
          text-center
        "
      >
        <p
          className="
            m-0
            mb-[18px]
            text-[10px]
            font-medium
            uppercase
            tracking-[0.22em]
            text-[#927552]
          "
        >
          Recognise the Pattern
        </p>

        <h2
          className="
            m-0
            font-serif
            text-[clamp(34px,3.7vw,52px)]
            font-medium
            leading-[1]
            tracking-[-0.04em]
            text-[#211d19]
          "
        >
          Why do the same patterns keep returning?
        </h2>

        <p
          className="
            mx-auto
            mt-[18px]
            max-w-[680px]
            text-[13px]
            leading-[1.55]
            text-[#716b62]
          "
        >
          Sometimes what looks like a problem is a protective pattern
          that once helped you get through something difficult.
        </p>
      </motion.div>


      {/* =====================================================
          PATTERN ITEMS
      ====================================================== */}

      <div
        className="
          relative
          z-[2]
          mx-auto
          mt-[38px]
          flex
          w-full
          max-w-[1160px]
          items-start
          justify-between
          gap-[12px]
          max-[1000px]:grid
          max-[1000px]:grid-cols-5
          max-[700px]:grid-cols-3
          max-[700px]:gap-[18px]
        "
      >
        {patterns.map((pattern, index) => {
          const Icon = pattern.icon;

          return (
            <motion.div
              key={pattern.title}
              initial={{
                opacity: 0,
                y: 18,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.55,
                delay: index * 0.06,
                ease,
              }}
              whileHover={{
                y: -5,
              }}
              className="
                group
                flex
                min-w-0
                flex-1
                cursor-pointer
                flex-col
                items-center
                text-center
              "
            >

              {/* Icon box */}

              <div
                className="
                  flex
                  h-[68px]
                  w-[68px]
                  items-center
                  justify-center
                  rounded-[15px]
                  border
                  border-[#eee5d8]
                  bg-[#fffdf9]
                  shadow-[0_5px_20px_rgba(79,64,42,0.045)]
                  transition-all
                  duration-300
                  group-hover:border-[#d9c5a7]
                  group-hover:shadow-[0_10px_25px_rgba(79,64,42,0.09)]
                  max-[700px]:h-[62px]
                  max-[700px]:w-[62px]
                "
              >
                <Icon
                  strokeWidth={1.35}
                  className="
                    h-[29px]
                    w-[29px]
                    text-[#b48651]
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  "
                />
              </div>


              {/* Label */}

              <div
                className="
                  mt-[10px]
                  min-h-[30px]
                  text-[11px]
                  font-medium
                  leading-[1.15]
                  text-[#38352f]
                  max-[700px]:text-[10px]
                "
              >
                <span>{pattern.title}</span>

                {pattern.secondLine && (
                  <>
                    <br />
                    <span>{pattern.secondLine}</span>
                  </>
                )}
              </div>

            </motion.div>
          );
        })}
      </div>


      {/* =====================================================
          EXPLORE PATTERN
      ====================================================== */}

      <motion.button
        initial={{
          opacity: 0,
          y: 10,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          duration: 0.7,
          delay: 0.55,
          ease,
        }}
        whileHover={{
          y: -2,
        }}
        className="
          relative
          z-[2]
          mx-auto
          mt-[26px]
          flex
          items-center
          gap-[9px]
          border-0
          bg-transparent
          p-0
          text-[11px]
          font-medium
          tracking-[0.02em]
          text-[#a6783e]
        "
      >
        <span>Explore your pattern</span>

        <motion.span
          animate={{
            y: [0, 3, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-[15px]"
        >
          ↓
        </motion.span>
      </motion.button>

    </section>
  );
}
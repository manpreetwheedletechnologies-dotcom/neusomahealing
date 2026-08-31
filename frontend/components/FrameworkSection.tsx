"use client";

import { Reveal } from "@/components/Reveal";
import { framework } from "@/lib/home-data";
import { motion } from "framer-motion";
import { useState } from "react";

export function FrameworkSection() {
  const icons = ["♡", "≈", "✧"];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Deterministic values — no Math.random(), so SSR/client hydration stays identical
  const particles = [
    { left: 14, top: 22, duration: 5, delay: 0 },
    { left: 29, top: 68, duration: 6, delay: 0.8 },
    { left: 46, top: 35, duration: 4.5, delay: 1.2 },
    { left: 63, top: 76, duration: 5.5, delay: 0.4 },
    { left: 78, top: 19, duration: 6.5, delay: 1.6 },
    { left: 89, top: 58, duration: 4.8, delay: 2 },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f7f1e7] via-[#f5efe5] to-[#f0e8db] px-6 py-[90px]">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-0 h-[300px] w-[300px] rounded-full border border-[#d9c8ae]/30"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="absolute -left-10 top-8 h-[240px] w-[240px] rounded-full border border-[#d9c8ae]/20"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="absolute right-[-80px] top-[-30px] h-[320px] w-[320px] rounded-full border border-[#d9c8ae]/20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 120, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Floating particles */}
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-[#a9783d]/10"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px]">
        {/* Heading */}
        <Reveal className="mb-[40px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="m-0 font-serif text-[32px] font-medium leading-none text-[#182d32] md:text-[42px]">
              H.R.T. Framework
            </h2>

            <div className="mx-auto mt-2 h-[2px] w-12 bg-[#a9783d]" />

            <p className="mt-[12px] text-[13px] tracking-[0.15em] text-[#526064]">
              A compassionate path from understanding to transformation.
            </p>
          </motion.div>
        </Reveal>

        {/* Framework flow */}
        <div className="flex items-center justify-center gap-0 max-[900px]:flex-col max-[900px]:gap-5">
          {framework.map((item, index) => (
            <motion.div
              key={item.number}
              className="flex w-full items-center max-[900px]:flex-col"
              initial={{
                opacity: 0,
                x: index % 2 === 0 ? -50 : 50,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
            >
              {/* Card */}
              <motion.div
                className="
                  group
                  relative
                  flex
                  min-h-[200px]
                  w-full
                  max-w-[350px]
                  cursor-pointer
                  items-center
                  overflow-hidden
                  rounded-[20px]
                  border
                  border-[#e4d9c8]
                  bg-[#fffdf8]/90
                  px-[22px]
                  py-[24px]
                  shadow-[0_8px_30px_rgba(80,65,45,0.06)]
                  transition-all
                  duration-500
                  hover:-translate-y-2
                  hover:shadow-[0_20px_40px_rgba(80,65,45,0.12)]
                "
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{
                  scale: 1.02,
                  borderColor: "#a9783d",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                }}
              >
                {/* Hover gradient */}
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#a9783d]/5 to-transparent"
                  animate={{
                    opacity: hoveredIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* Decorative top-left circle */}
                <motion.div
                  className="pointer-events-none absolute -left-[45px] -top-[45px] h-[130px] w-[130px] rounded-full bg-[#dce4dc]/40 blur-[2px]"
                  animate={{
                    scale: hoveredIndex === index ? 1.3 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                />

                {/* Decorative bottom-right circle */}
                <motion.div
                  className="pointer-events-none absolute -bottom-[30px] -right-[30px] h-[80px] w-[80px] rounded-full bg-[#dce4dc]/20 blur-[1px]"
                  animate={{
                    scale: hoveredIndex === index ? 1.5 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                />

                {/* Icon */}
                <div className="relative z-10 flex w-[105px] shrink-0 items-center justify-center">
                  <motion.div
                    className="
                      flex
                      h-[100px]
                      w-[100px]
                      items-center
                      justify-center
                      rounded-full
                      bg-gradient-to-br
                      from-[#f1f2e9]
                      to-[#e8e9de]
                      font-serif
                      text-[62px]
                      font-light
                      leading-none
                      text-[#a9783d]
                      shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)]
                    "
                    animate={{
                      scale: hoveredIndex === index ? 1.1 : 1,
                      rotate:
                        hoveredIndex === index
                          ? [0, -5, 5, -5, 0]
                          : 0,
                    }}
                    transition={{
                      scale: {
                        duration: 0.3,
                      },
                      rotate: {
                        duration: 0.5,
                      },
                    }}
                  >
                    {icons[index] ?? "✧"}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="relative z-10 pl-[10px]">
                  <motion.div
                    className="mb-[5px] font-serif text-[12px] tracking-[0.12em]"
                    animate={{
                      color:
                        hoveredIndex === index
                          ? "#a9783d"
                          : "#78908a",
                    }}
                  >
                    {item.number}
                  </motion.div>

                  <h3 className="m-0 font-serif text-[22px] font-medium uppercase leading-[1] text-[#173139]">
                    {item.title}
                  </h3>

                  <motion.p
                    className="mt-[9px] text-[10px] leading-[1.65]"
                    animate={{
                      color:
                        hoveredIndex === index
                          ? "#2d3a37"
                          : "#5d6463",
                    }}
                  >
                    {item.body}
                  </motion.p>

                  {/* Hover line */}
                  <motion.div
                    className="mt-2 h-[1px] bg-[#a9783d]"
                    animate={{
                      width:
                        hoveredIndex === index ? "40px" : "0px",
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                  />
                </div>
              </motion.div>

              {/* Arrow between cards */}
              {index < framework.length - 1 && (
                <motion.div
                  className="
                    flex
                    w-[55px]
                    shrink-0
                    items-center
                    justify-center
                    max-[900px]:h-[25px]
                    max-[900px]:w-auto
                  "
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.15 + 0.3,
                  }}
                >
                  <div
                    className="
                      relative
                      h-[1px]
                      w-[45px]
                      bg-gradient-to-r
                      from-[#8ba09b]
                      to-[#a9783d]/30
                      max-[900px]:h-[35px]
                      max-[900px]:w-[1px]
                    "
                  >
                    <motion.span
                      className="
                        absolute
                        -right-[1px]
                        -top-[4px]
                        text-[13px]
                        text-[#708b85]
                        max-[900px]:-bottom-[3px]
                        max-[900px]:-left-[5px]
                        max-[900px]:right-auto
                        max-[900px]:top-auto
                        max-[900px]:rotate-90
                      "
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      →
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <Reveal className="mt-[40px] text-center">
          <motion.a
            href="/hrt-framework"
            className="
              group
              inline-flex
              items-center
              gap-3
              rounded-full
              border
              border-[#b9a98e]
              bg-white/50
              px-[24px]
              py-[11px]
              font-serif
              text-[13px]
              text-[#42534f]
              backdrop-blur-sm
              transition-all
              duration-300
              hover:bg-[#42534f]
              hover:text-white
              hover:shadow-lg
            "
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
          >
            Explore H.R.T.

            <motion.span
              className="text-[14px]"
              animate={{
                x: [0, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              →
            </motion.span>
          </motion.a>
        </Reveal>
      </div>
    </section>
  );
}
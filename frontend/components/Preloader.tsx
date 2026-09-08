"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import styles from "./Preloader.module.css";

type PreloaderProps = {
  minimumDuration?: number;
};

/* =========================================================
   AMBIENT BACKGROUND PARTICLES
========================================================= */

const AMBIENT_PARTICLES = [
  {
    left: "12%",
    top: "25%",
    size: 1.8,
    delay: 0.2,
    duration: 5.2,
  },
  {
    left: "20%",
    top: "72%",
    size: 2,
    delay: 0.8,
    duration: 5.8,
  },
  {
    left: "29%",
    top: "18%",
    size: 1.7,
    delay: 1.1,
    duration: 5.1,
  },
  {
    left: "36%",
    top: "80%",
    size: 2,
    delay: 0.5,
    duration: 6,
  },
  {
    left: "48%",
    top: "14%",
    size: 1.6,
    delay: 1.4,
    duration: 5.4,
  },
  {
    left: "59%",
    top: "78%",
    size: 1.9,
    delay: 0.4,
    duration: 5.7,
  },
  {
    left: "68%",
    top: "19%",
    size: 1.8,
    delay: 1,
    duration: 5.3,
  },
  {
    left: "77%",
    top: "68%",
    size: 2,
    delay: 1.5,
    duration: 6.2,
  },
  {
    left: "85%",
    top: "27%",
    size: 1.6,
    delay: 0.7,
    duration: 5,
  },
  {
    left: "91%",
    top: "72%",
    size: 1.8,
    delay: 1.2,
    duration: 5.6,
  },
];

/* =========================================================
   BRAIN NEURONS
========================================================= */

const NEURONS = [
  "n1",
  "n2",
  "n3",
  "n4",
  "n5",
  "n6",
  "n7",
  "n8",
  "n9",
  "n10",
  "n11",
  "n12",
  "n13",
  "n14",
  "n15",
  "n16",
];

type GoldenParticleConvergenceProps = {
  onComplete: () => void;
};

function GoldenParticleConvergence({
  onComplete,
}: GoldenParticleConvergenceProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );

  const [
    isFinishing,
    setIsFinishing,
  ] = useState(false);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d", {
        alpha: true,
      });

    if (!ctx) return;

    let animationFrame = 0;

    let completionTimer:
      | number
      | undefined;

    let hasCompleted = false;

   /*
 * First particles become visible
 * across the complete screen.
 *
 * After that the existing vortex
 * suction starts.
 */
const INTRO_REVEAL_DURATION =
  320;

const VORTEX_DURATION =
  2430;

const TOTAL_DURATION =
  INTRO_REVEAL_DURATION +
  VORTEX_DURATION;

const TWO_PI =
  Math.PI * 2;

    type Particle = {
      startRadius: number;

      startAngle: number;

      turns: number;

      size: number;

      alpha: number;

      delay: number;

      depth: number;

      glow: boolean;

      phase: number;
    };

    let particles:
      Particle[] = [];

    let viewportWidth = 0;
    let viewportHeight = 0;

    /* =========================================
       PARTICLE CREATION
    ========================================= */

  function createParticles(
  width: number,
  height: number,
) {
  const isMobile =
    width < 768;

  const logicalCores =
    navigator.hardwareConcurrency ||
    8;

  /*
   * Thousands of particles.
   *
   * Desktop:
   * 2700 - 3800
   *
   * Mobile:
   * 1500 - 2100
   *
   * fillRect rendering ki wajah se
   * performance manageable rahegi.
   */
  let particleCount: number;

  if (isMobile) {
    particleCount =
      logicalCores <= 4
        ? 1500
        : 2100;
  } else {
    particleCount =
      logicalCores <= 4
        ? 2700
        : 3800;
  }

  /*
   * IMPORTANT:
   *
   * Random radial distribution ki jagah
   * screen ko invisible grid me divide
   * kar rahe hain.
   *
   * Isse particles poori screen me
   * evenly visible honge.
   *
   * Koi large empty area nahi rahega.
   */
  const aspectRatio =
    width / height;

  const columns =
    Math.ceil(
      Math.sqrt(
        particleCount *
          aspectRatio,
      ),
    );

  const rows =
    Math.ceil(
      particleCount /
        columns,
    );

  particles =
    Array.from(
      {
        length:
          particleCount,
      },

      (_, index) => {
        const column =
          index %
          columns;

        const row =
          Math.floor(
            index /
              columns,
          );

        /*
         * Each particle gets its own
         * screen cell with random jitter.
         *
         * Result:
         *
         * evenly distributed particles
         * without looking like a grid.
         */
        const cellWidth =
          width /
          columns;

        const cellHeight =
          height /
          rows;

        const startX =
          column *
            cellWidth +
          Math.random() *
            cellWidth;

        const startY =
          row *
            cellHeight +
          Math.random() *
            cellHeight;

        const centerX =
          width / 2;

        const centerY =
          height / 2;

        const dx =
          startX -
          centerX;

        const dy =
          startY -
          centerY;

        const startRadius =
          Math.sqrt(
            dx * dx +
              dy * dy,
          );

        const startAngle =
          Math.atan2(
            dy,
            dx,
          );

        return {
          startRadius,

          startAngle,

          /*
           * Same black-hole circular
           * motion jo abhi tumhe
           * correct lag raha hai.
           */
          turns:
            1.7 +
            Math.random() *
              1.35,

          /*
           * Thoda more visible,
           * but still premium.
           */
         size:
  0.85 +
  Math.random() *
    1.4,

alpha:
  0.68 +
  Math.random() *
    0.3,

          /*
           * Very small stagger.
           *
           * Long delays nahi rakhenge
           * warna screen uneven lagegi.
           */
          delay:
            Math.random() *
              110,

          depth:
            0.78 +
            Math.random() *
              0.42,

          /*
           * More glowing particles.
           *
           * Pehle around every 11th tha.
           * Ab around every 8th.
           */
         glow:
  index % 6 ===
  0,

          phase:
            Math.random() *
            TWO_PI,
        };
      },
    );
}

    /* =========================================
       RESIZE
    ========================================= */

    function resize() {
      viewportWidth =
        window.innerWidth;

      viewportHeight =
        window.innerHeight;

      /*
       * High DPR makes thousands of
       * particles unnecessarily expensive.
       *
       * 1.5 still looks crisp while
       * keeping animation smooth.
       */
      const dpr =
        Math.min(
          window.devicePixelRatio ||
            1,
          1.5,
        );

      canvas.width =
        Math.round(
          viewportWidth * dpr,
        );

      canvas.height =
        Math.round(
          viewportHeight * dpr,
        );

      canvas.style.width =
        `${viewportWidth}px`;

      canvas.style.height =
        `${viewportHeight}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0,
      );

      createParticles(
        viewportWidth,
        viewportHeight,
      );
    }

    /* =========================================
       SMOOTH PROGRESS
    ========================================= */

    function smoothStep(
      value: number,
    ) {
      const t =
        Math.min(
          Math.max(
            value,
            0,
          ),
          1,
        );

      return (
        t *
        t *
        (
          3 -
          2 * t
        )
      );
    }

    /* =========================================
       DRAW BLACK-HOLE CORE
    ========================================= */

    function drawCore(
      centerX: number,
      centerY: number,
      progress: number,
    ) {
      /*
       * Small premium golden accretion glow.
       *
       * Huge flash intentionally avoided.
       */
      const visibility =
        Math.min(
          Math.max(
            (
              progress -
              0.25
            ) /
              0.75,
            0,
          ),
          1,
        );

      if (
        visibility <= 0
      ) {
        return;
      }

      const radius =
        22 +
        visibility *
          42;

      const gradient =
        ctx.createRadialGradient(
          centerX,
          centerY,
          0,

          centerX,
          centerY,
          radius,
        );

      gradient.addColorStop(
        0,
        `rgba(
          255,
          244,
          212,
          ${
            0.16 *
            visibility
          }
        )`,
      );

      gradient.addColorStop(
        0.18,
        `rgba(
          242,
          188,
          91,
          ${
            0.11 *
            visibility
          }
        )`,
      );

      gradient.addColorStop(
        0.55,
        `rgba(
          221,
          150,
          48,
          ${
            0.035 *
            visibility
          }
        )`,
      );

      gradient.addColorStop(
        1,
        "rgba(0,0,0,0)",
      );

      ctx.globalAlpha = 1;

      ctx.fillStyle =
        gradient;

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        TWO_PI,
      );

      ctx.fill();

      /*
       * Tiny dark singularity.
       */
      const coreSize =
        4 +
        visibility * 7;

      ctx.fillStyle =
        `rgba(
          0,
          0,
          8,
          ${
            0.75 *
            visibility
          }
        )`;

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        coreSize,
        0,
        TWO_PI,
      );

      ctx.fill();
    }

    /* =========================================
       RENDER
    ========================================= */

    const startTime =
      performance.now();

    function render(
      now: number,
    ) {
      const elapsed =
        now - startTime;

      const width =
        viewportWidth;

      const height =
        viewportHeight;

      const centerX =
        width / 2;

      const centerY =
        height / 2;

      ctx.clearRect(
        0,
        0,
        width,
        height,
      );

     /*
 * First 320ms:
 *
 * particles full screen par
 * softly emerge honge.
 */
const revealProgress =
  Math.min(
    elapsed /
      INTRO_REVEAL_DURATION,
    1,
  );

/*
 * Vortex movement starts only
 * after full-screen reveal.
 */
const vortexElapsed =
  Math.max(
    elapsed -
      INTRO_REVEAL_DURATION,
    0,
  );

const globalProgress =
  Math.min(
    vortexElapsed /
      VORTEX_DURATION,
    1,
  );

drawCore(
  centerX,
  centerY,
  globalProgress,
);

      /*
       * Additive blending makes overlapping
       * golden particles naturally brighter
       * without expensive shadowBlur.
       */
      ctx.save();

      ctx.globalCompositeOperation =
        "lighter";

      for (
        const particle
        of particles
      ) {
      /*
 * Movement starts after
 * INTRO_REVEAL_DURATION.
 *
 * Before that particles still
 * render at their starting
 * positions.
 */
const localElapsed =
  vortexElapsed -
  particle.delay;

const availableTime =
  Math.max(
    VORTEX_DURATION -
      particle.delay,
    1,
  );

const rawProgress =
  localElapsed <= 0
    ? 0
    : Math.min(
        localElapsed /
          availableTime,
        1,
      );
        /*
         * Smooth radial collapse.
         */
        const pull =
          smoothStep(
            rawProgress,
          );

        /*
         * Radius continuously gets
         * smaller.
         *
         * The exponent makes the final
         * suction faster but remains
         * mathematically smooth.
         */
        const radius =
          particle.startRadius *
          Math.pow(
            1 - pull,
            1.12,
          );

        /*
         * Rotation speeds up slightly as
         * particle gets closer to center.
         *
         * Gives actual black-hole spiral
         * instead of a bent straight line.
         */
        const rotationProgress =
          rawProgress +
          rawProgress *
            rawProgress *
            0.34;

        const angle =
          particle.startAngle +
          particle.turns *
            TWO_PI *
            rotationProgress;

        /*
         * Tiny organic vibration only.
         * It disappears near singularity.
         */
        const microWave =
          Math.sin(
            rawProgress *
              8 +
              particle.phase,
          ) *
          1.8 *
          (
            1 -
            pull
          );

        const currentRadius =
          Math.max(
            radius +
              microWave,
            0,
          );

        const x =
          centerX +
          Math.cos(
            angle,
          ) *
            currentRadius;

        const y =
          centerY +
          Math.sin(
            angle,
          ) *
            currentRadius;

        /*
         * Fade only when particle has
         * practically entered singularity.
         */
        let endFade = 1;

        if (
          rawProgress >
          0.94
        ) {
          endFade =
            Math.max(
              0,
              1 -
                (
                  rawProgress -
                  0.94
                ) /
                  0.06,
            );
        }

        /*
         * Slight brightness boost while
         * accelerating inward.
         */
        const inwardBoost =
          0.75 +
          pull * 0.5;

       const alpha =
  Math.min(
    particle.alpha *
      inwardBoost *
      endFade *
      revealProgress,
    1,
  );

        if (
          alpha <=
          0.01
        ) {
          continue;
        }

        /*
         * Particle becomes slightly smaller
         * near the center, making absorption
         * clean rather than forming a blob.
         */
        const size =
          Math.max(
            0.35,
            particle.size *
              particle.depth *
              (
                1 -
                pull * 0.42
              ),
          );

        /*
         * Main golden particle.
         *
         * fillRect is dramatically cheaper
         * than thousands of arc + shadowBlur
         * operations and at this tiny size
         * still visually reads as a dot.
         */
        ctx.globalAlpha =
          alpha;

       ctx.fillStyle =
  particle.glow
    ? "#fff1c7"
    : "#f6c86f";

        ctx.fillRect(
          x - size / 2,
          y - size / 2,
          size,
          size,
        );

        /*
         * Only ~1/11 particles receive
         * an extra soft glow.
         *
         * No shadowBlur.
         */
        if (
          particle.glow
        ) {
          const glowSize =
            size * 3.4;

        ctx.globalAlpha =
  alpha * 0.28;

ctx.fillStyle =
  "#ffda88";
          ctx.fillRect(
            x -
              glowSize / 2,
            y -
              glowSize / 2,
            glowSize,
            glowSize,
          );
        }
      }

      ctx.restore();

      ctx.globalAlpha = 1;

     if (
  elapsed <
  TOTAL_DURATION
) {
  animationFrame =
    requestAnimationFrame(
      render,
    );

  return;
}

      /*
       * IMPORTANT:
       *
       * Canvas itself controls completion.
       * No separate Framer timer.
       *
       * So there is no frozen gap between
       * last particle and image reveal.
       */
      if (
        !hasCompleted
      ) {
        hasCompleted = true;

        setIsFinishing(
          true,
        );

        completionTimer =
          window.setTimeout(
            () => {
              onComplete();
            },
            180,
          );
      }
    }

    resize();

    animationFrame =
      requestAnimationFrame(
        render,
      );

    window.addEventListener(
      "resize",
      resize,
    );

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );

      if (
        completionTimer
      ) {
        window.clearTimeout(
          completionTimer,
        );
      }

      window.removeEventListener(
        "resize",
        resize,
      );
    };
  }, []);

  return (
    <motion.div
      className={
        styles.particleConvergence
      }
      initial={{
        opacity: 1,
      }}
      animate={{
        opacity:
          isFinishing
            ? 0
            : 1,
      }}
      transition={{
        duration: 0.18,
        ease: "easeOut",
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className={
          styles.particleConvergenceCanvas
        }
      />
    </motion.div>
  );
}

export function Preloader({
  minimumDuration = 4700,
}: PreloaderProps) {
  const [
    isVisible,
    setIsVisible,
  ] = useState(true);

  const [
    isLeaving,
    setIsLeaving,
  ] = useState(false);

  const [
  particleIntroDone,
  setParticleIntroDone,
] = useState(false);

  const mountedAt =
    useRef(Date.now());

  const hasStartedExit =
    useRef(false);

  useEffect(() => {
    document.documentElement.classList.add(
      "preloader-active",
    );

    document.body.classList.add(
      "preloader-active",
    );

    const finish = () => {
      if (
        hasStartedExit.current
      ) {
        return;
      }

      hasStartedExit.current =
        true;

      const elapsed =
        Date.now() -
        mountedAt.current;

      const remaining =
        Math.max(
          minimumDuration -
            elapsed,
          0,
        );

      window.setTimeout(() => {
        setIsLeaving(true);

        window.setTimeout(
          () => {
            setIsVisible(false);

            document.documentElement.classList.remove(
              "preloader-active",
            );

            document.body.classList.remove(
              "preloader-active",
            );
          },
          720,
        );
      }, remaining);
    };

    if (
      document.readyState ===
      "complete"
    ) {
      finish();
    } else {
      window.addEventListener(
        "load",
        finish,
        {
          once: true,
        },
      );
    }

    const fallbackTimer =
      window.setTimeout(
        finish,
        7000,
      );

    return () => {
      window.removeEventListener(
        "load",
        finish,
      );

      window.clearTimeout(
        fallbackTimer,
      );

      document.documentElement.classList.remove(
        "preloader-active",
      );

      document.body.classList.remove(
        "preloader-active",
      );
    };
  }, [minimumDuration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`${styles.preloader} ${
            isLeaving
              ? styles.leaving
              : ""
          }`}
          role="status"
          aria-live="polite"
          aria-label="NeusomaHealing is loading"
          initial={{
            opacity: 1,
          }}
          animate={{
            opacity:
              isLeaving
                ? 0
                : 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.72,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        >
          {/* ================================================
              BACKGROUND
          ================================================= */}

          <div
            className={
              styles.backgroundAura
            }
            aria-hidden="true"
          />

          <div
            className={
              styles.vignette
            }
            aria-hidden="true"
          />

          {/* ================================================
              AMBIENT STARS
          ================================================= */}

         <motion.div
  className={
    styles.particleField
  }
  aria-hidden="true"
  initial={{
    opacity: 0,
  }}
  animate={{
    opacity:
      particleIntroDone
        ? 1
        : 0,
  }}
  transition={{
    duration: 0.65,
    ease: "easeOut",
  }}
>
            {AMBIENT_PARTICLES.map(
              (
                particle,
                index,
              ) => (
                <motion.span
                  key={
                    index
                  }
                  className={
                    styles.particle
                  }
                  style={{
                    left:
                      particle.left,

                    top:
                      particle.top,

                    width:
                      `${particle.size}px`,

                    height:
                      `${particle.size}px`,
                  }}
                  animate={{
                    opacity: [
                      0.04,
                      0.48,
                      0.08,
                    ],

                    scale: [
                      0.7,
                      1.35,
                      0.8,
                    ],

                    y: [
                      0,
                      -6,
                      -1,
                    ],
                  }}
                  transition={{
                    duration:
                      particle.duration,

                    delay:
                      particle.delay,

                    repeat:
                      Infinity,

                    ease:
                      "easeInOut",
                  }}
                />
              ),
            )}
          </motion.div>

         {/* ================================================
    GOLDEN PARTICLE CONVERGENCE
================================================= */}

<GoldenParticleConvergence
  onComplete={() =>
    setParticleIntroDone(
      true,
    )
  }
/>

          {/* ================================================
              PERMANENT ORBIT AFTER INTRO
          ================================================= */}

          <motion.div
            className={`${styles.orbit} ${styles.orbitOuter}`}
            aria-hidden="true"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: [
                0,
                0,
                0.14,
                0.24,
                0.14,
              ],

              rotate: [
                0,
                360,
              ],
            }}
            transition={{
              opacity: {
                duration: 4,
                times: [
                  0,
                  0.45,
                  0.62,
                  0.8,
                  1,
                ],
              },

              rotate: {
                duration: 18,
                delay: 1.8,
                repeat:
                  Infinity,
                ease:
                  "linear",
              },
            }}
          />

          <motion.div
            className={`${styles.orbit} ${styles.orbitInner}`}
            aria-hidden="true"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: [
                0,
                0,
                0.08,
                0.16,
                0.08,
              ],

              rotate: [
                360,
                0,
              ],
            }}
            transition={{
              opacity: {
                duration: 4,
                times: [
                  0,
                  0.45,
                  0.62,
                  0.8,
                  1,
                ],
              },

              rotate: {
                duration: 15,
                delay: 1.8,
                repeat:
                  Infinity,
                ease:
                  "linear",
              },
            }}
          />

          {/* ================================================
              MAIN VISUAL
          ================================================= */}

          <div
            className={
              styles.visualWrap
            }
          >
            {/* IMAGE MATERIALIZATION */}

           <motion.div
  className={
    styles.imageReveal
  }
  initial={{
    opacity: 0,
  }}
  animate={{
    opacity:
      particleIntroDone
        ? 1
        : 0,
  }}
  transition={{
    duration: 0.48,
    ease: [
      0.16,
      1,
      0.3,
      1,
    ],
  }}
>
                  <motion.div
                className={
                  styles.imageStage
                }
                animate={{
                  y: [
                    0,
                    -3,
                    0,
                  ],

                  scale: [
                    1,
                    1.006,
                    1,
                  ],
                }}
                transition={{
                  duration: 4.8,

                  delay: 2.5,

                  repeat:
                    Infinity,

                  ease:
                    "easeInOut",
                }}
              >
                <img
                  src="/images/neusoma-preloader-brain.png"
                  alt=""
                  aria-hidden="true"
                  className={
                    styles.brainBase
                  }
                />

                {/* Single premium scanner after materialization */}

                <span
                  className={
                    styles.revealScanner
                  }
                  aria-hidden="true"
                />

                {/* BRAIN-ONLY EFFECTS */}

                <span
                  className={
                    styles.goldBrainAura
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.cyanBrainAura
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.goldWave
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.cyanWave
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.energySweep
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.neuralArcOne
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.neuralArcTwo
                  }
                  aria-hidden="true"
                />

                {NEURONS.map(
                  (
                    neuron,
                  ) => (
                    <span
                      key={
                        neuron
                      }
                      className={`${styles.neuron} ${styles[neuron]}`}
                      aria-hidden="true"
                    />
                  ),
                )}
              </motion.div>
            </motion.div>

            {/* ================================================
                BRAND REVEAL
            ================================================= */}

            <motion.div
  className={
    styles.brand
  }
  initial={{
    opacity: 0,
    y: 12,
    filter:
      "blur(10px)",
  }}
  animate={
    particleIntroDone
      ? {
          opacity: 1,
          y: 0,
          filter:
            "blur(0px)",
        }
      : {
          opacity: 0,
          y: 12,
          filter:
            "blur(10px)",
        }
  }
  transition={{
    duration: 0.75,
    delay: 0.72,
    ease: [
      0.16,
      1,
      0.3,
      1,
    ],
  }}
>
              <motion.p
                className={
                  styles.brandName
                }
                initial={{
                  letterSpacing:
                    "0.7em",

                  opacity:
                    0,
                }}
                animate={{
                  letterSpacing:
                    "0.28em",

                  opacity:
                    1,
                }}
                transition={{
                  duration:
                    0.9,

                  delay:
                    2.48,

                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ],
                }}
              >
                NEUSOMAHEALING
              </motion.p>

              <motion.div
                className={
                  styles.loadingTrack
                }
                initial={{
                  scaleX: 0,
                  opacity: 0,
                }}
                animate={{
                  scaleX: 1,
                  opacity: 1,
                }}
                transition={{
                  duration:
                    0.7,

                  delay:
                    2.85,

                  ease: [
                    0.16,
                    1,
                    0.3,
                    1,
                  ],
                }}
                aria-hidden="true"
              >
                <span
                  className={
                    styles.loadingGlow
                  }
                />
              </motion.div>

              <motion.p
                className={
                  styles.tagline
                }
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration:
                    0.65,

                  delay:
                    3.02,

                  ease:
                    "easeOut",
                }}
              >
                HEAL · REGULATE · TRANSFORM
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
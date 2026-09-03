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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let animationFrame = 0;
    let startTime = performance.now();

    const PARTICLE_DURATION = 1850;

    type Particle = {
      x: number;
      y: number;
      startX: number;
      startY: number;
      size: number;
      alpha: number;
      delay: number;
      curve: number;
      glow: number;
      speed: number;
    };

    let particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.75,
      );

      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      createParticles(width, height);
    }

    function createParticles(
      width: number,
      height: number,
    ) {
      const isMobile = width < 768;

      /*
       * Canvas handles this much better than
       * thousands of DOM nodes.
       */
      const particleCount = isMobile ? 900 : 1800;

      particles = Array.from(
        { length: particleCount },
        () => {
          /*
           * Spawn particles all across viewport,
           * but favour screen edges so movement
           * toward center feels dramatic.
           */

          const edgeBias = Math.random();

          let x: number;
          let y: number;

          if (edgeBias < 0.58) {
            const edge = Math.floor(Math.random() * 4);

            if (edge === 0) {
              x = Math.random() * width;
              y = Math.random() * height * 0.18;
            } else if (edge === 1) {
              x = width - Math.random() * width * 0.12;
              y = Math.random() * height;
            } else if (edge === 2) {
              x = Math.random() * width;
              y = height - Math.random() * height * 0.18;
            } else {
              x = Math.random() * width * 0.12;
              y = Math.random() * height;
            }
          } else {
            x = Math.random() * width;
            y = Math.random() * height;
          }

          return {
            x,
            y,

            startX: x,
            startY: y,

            size: 0.45 + Math.random() * 1.6,

            alpha: 0.22 + Math.random() * 0.78,

            delay: Math.random() * 380,

            /*
             * Positive / negative gives clockwise
             * and counter-clockwise curved movement.
             */
            curve:
              (Math.random() - 0.5) *
              (80 + Math.random() * 170),

            glow: Math.random(),

            speed:
              0.85 + Math.random() * 0.3,
          };
        },
      );
    }

  function convergenceEase(value: number) {
  const t = Math.min(
    Math.max(value, 0),
    1,
  );

  return (
    t < 0.45
      ? 1.8 * t * t
      : 1 -
        Math.pow(
          1 - t,
          3.2,
        )
  );
}

    function render(now: number) {
      const elapsed = now - startTime;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      /*
       * Subtle central atmospheric glow.
       */

      const progress = Math.min(
        elapsed / PARTICLE_DURATION,
        1,
      );

      if (progress > 0.48) {
        const glowProgress =
          (progress - 0.48) / 0.52;

        const coreRadius =
          12 + glowProgress * 105;

        const gradient =
          ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            coreRadius,
          );

        gradient.addColorStop(
          0,
          `rgba(255, 237, 191, ${
            0.32 * glowProgress
          })`,
        );

        gradient.addColorStop(
          0.18,
          `rgba(238, 183, 88, ${
            0.2 * glowProgress
          })`,
        );

        gradient.addColorStop(
          1,
          "rgba(219, 149, 47, 0)",
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
          centerX,
          centerY,
          coreRadius,
          0,
          Math.PI * 2,
        );

        ctx.fill();
      }

      for (const particle of particles) {
        const localElapsed =
          elapsed - particle.delay;

        if (localElapsed <= 0) continue;

        const localDuration =
          (PARTICLE_DURATION -
            particle.delay) /
          particle.speed;

        const rawProgress = Math.min(
          localElapsed / localDuration,
          1,
        );

        /*
         * Starts controlled, then accelerates
         * hard toward the center.
         */

        const pull =
  convergenceEase(
    rawProgress,
  );
        const dx =
          centerX - particle.startX;

        const dy =
          centerY - particle.startY;

        const distance =
          Math.sqrt(dx * dx + dy * dy) || 1;

        const perpendicularX =
          -dy / distance;

        const perpendicularY =
          dx / distance;

        /*
         * Curvature disappears while particle
         * reaches the central singularity.
         */

        const curveStrength =
          Math.sin(rawProgress * Math.PI) *
          particle.curve;

        particle.x =
          particle.startX +
          dx * pull +
          perpendicularX *
            curveStrength *
            (1 - pull * 0.65);

        particle.y =
          particle.startY +
          dy * pull +
          perpendicularY *
            curveStrength *
            (1 - pull * 0.65);

        /*
         * Fade only when practically absorbed.
         */

        const endFade =
          rawProgress > 0.9
            ? 1 -
              (rawProgress - 0.9) / 0.1
            : 1;

        const arrivalBoost =
          rawProgress > 0.65
            ? 1.2
            : 1;

        const alpha =
          particle.alpha *
          endFade *
          arrivalBoost;

        if (alpha <= 0.01) continue;

        /*
         * Bright core.
         */

        ctx.beginPath();

        ctx.fillStyle =
          particle.glow > 0.82
            ? `rgba(255, 239, 198, ${alpha})`
            : `rgba(239, 186, 91, ${alpha})`;

        ctx.shadowBlur =
          particle.glow > 0.7
            ? 8
            : 3;

        ctx.shadowColor =
          particle.glow > 0.82
            ? "rgba(255, 218, 147, .85)"
            : "rgba(226, 158, 54, .55)";

        const size =
          particle.size *
          (0.8 + pull * 0.55);

        ctx.arc(
          particle.x,
          particle.y,
          size,
          0,
          Math.PI * 2,
        );

        ctx.fill();

        /*
         * Tiny motion streak as particle speed rises.
         */

        if (
          rawProgress > 0.55 &&
          rawProgress < 0.94 &&
          particle.glow > 0.48
        ) {
          const previousPull =
            convergenceEase(
              Math.max(
                rawProgress - 0.018,
                0,
              ),
            );

          const previousX =
            particle.startX +
            dx * previousPull +
            perpendicularX *
              curveStrength *
              (1 - previousPull * 0.65);

          const previousY =
            particle.startY +
            dy * previousPull +
            perpendicularY *
              curveStrength *
              (1 - previousPull * 0.65);

          ctx.beginPath();

          ctx.moveTo(
            previousX,
            previousY,
          );

          ctx.lineTo(
            particle.x,
            particle.y,
          );

          ctx.strokeStyle = `rgba(235, 176, 73, ${
            alpha * 0.28
          })`;

          ctx.lineWidth = 0.6;

          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;

      if (elapsed < PARTICLE_DURATION + 100) {
        animationFrame =
          requestAnimationFrame(render);
      }
    }

    resize();

    startTime =
      performance.now();

    animationFrame =
      requestAnimationFrame(render);

    window.addEventListener(
      "resize",
      resize,
    );

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );

      window.removeEventListener(
        "resize",
        resize,
      );
    };
  }, []);

  return (
    <motion.div
      className={styles.particleConvergence}
      initial={{
        opacity: 1,
      }}
      animate={{
        opacity: [
          1,
          1,
          1,
          0,
        ],
      }}
      transition={{
        duration: 2.35,
        times: [
          0,
          0.78,
          0.94,
          1,
        ],
        ease: "easeOut",
      }}
      onAnimationComplete={onComplete}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className={
          styles.particleConvergenceCanvas
        }
      />

      {/* final central ignition */}

      <motion.span
        className={
          styles.convergenceCore
        }
        initial={{
          opacity: 0,
          scale: 0.1,
        }}
        animate={{
          opacity: [
            0,
            0,
            0.15,
            1,
            0,
          ],

          scale: [
            0.1,
            0.1,
            0.5,
            1,
            2.8,
          ],
        }}
        transition={{
          duration: 0.82,
          delay: 1.25,
          ease: "easeOut",
        }}
      />

      <motion.span
        className={
          styles.convergencePulse
        }
        initial={{
          opacity: 0,
          scale: 0.1,
        }}
        animate={{
          opacity: [
            0,
            0.6,
            0,
          ],

          scale: [
            0.1,
            0.8,
            2.2,
          ],
        }}
        transition={{
          duration: 0.6,
          delay: 1.58,
          ease: "easeOut",
        }}
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

          <div
            className={
              styles.particleField
            }
            aria-hidden="true"
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
          </div>

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

    scale: 0.72,

    filter:
      "blur(24px) brightness(1.7)",

    clipPath:
      "circle(0% at 50% 46%)",
  }}
  animate={
    particleIntroDone
      ? {
          opacity: 1,

          scale: [
            0.72,
            0.94,
            1.025,
            1,
          ],

          filter: [
            "blur(24px) brightness(1.7)",
            "blur(12px) brightness(1.38)",
            "blur(2px) brightness(1.08)",
            "blur(0px) brightness(1)",
          ],

          clipPath: [
            "circle(0% at 50% 46%)",
            "circle(18% at 50% 46%)",
            "circle(50% at 50% 46%)",
            "circle(76% at 50% 46%)",
          ],
        }
      : {
          opacity: 0,

          scale: 0.72,

          filter:
            "blur(24px) brightness(1.7)",

          clipPath:
            "circle(0% at 50% 46%)",
        }
  }
  transition={{
    duration: 1.2,

    delay: 0.04,

    ease: [
      0.16,
      1,
      0.3,
      1,
    ],
  }}
>              <motion.div
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
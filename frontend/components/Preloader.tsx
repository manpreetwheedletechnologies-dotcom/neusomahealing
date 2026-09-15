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
import EmblemPreloader from "./EmblemPreloader"

type PreloaderProps = {
  minimumDuration?: number;
  onDone?: () => void;
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
   EMBLEM BACKGROUND PARTICLES
   Small ambient glow-dots that float behind the SVG emblem
   after it materializes, for a "premium" layered feel.
========================================================= */

const EMBLEM_BG_PARTICLES = [
  { left: "22%", top: "30%", size: 2, delay: 0.1, duration: 3.4 },
  { left: "70%", top: "22%", size: 1.6, delay: 0.5, duration: 3.8 },
  { left: "35%", top: "75%", size: 1.8, delay: 0.3, duration: 3.2 },
  { left: "78%", top: "68%", size: 2.2, delay: 0.7, duration: 4 },
  { left: "50%", top: "12%", size: 1.5, delay: 0.9, duration: 3.6 },
  { left: "18%", top: "58%", size: 1.9, delay: 0.2, duration: 3.9 },
  { left: "62%", top: "82%", size: 1.7, delay: 0.6, duration: 3.5 },
  { left: "88%", top: "45%", size: 1.6, delay: 1.0, duration: 4.1 },
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

/* =========================================================
   MATERIALIZE SPARKS
   Small embers that scatter outward from the convergence
   point right as the image appears, as if the particles
   themselves are settling into the image surface.
========================================================= */

const MATERIALIZE_SPARKS = [
  { dx: -58, dy: -22, size: 3, delay: 0, gold: true },
  { dx: 46, dy: -38, size: 2.5, delay: 0.02, gold: false },
  { dx: -32, dy: 44, size: 2.8, delay: 0.04, gold: true },
  { dx: 60, dy: 18, size: 2.4, delay: 0.01, gold: false },
  { dx: -66, dy: 6, size: 3.2, delay: 0.06, gold: true },
  { dx: 20, dy: -56, size: 2.6, delay: 0.03, gold: false },
  { dx: 38, dy: 50, size: 2.9, delay: 0.05, gold: true },
  { dx: -18, dy: -60, size: 2.4, delay: 0.02, gold: false },
  { dx: 64, dy: -14, size: 2.7, delay: 0.07, gold: true },
  { dx: -48, dy: -46, size: 2.5, delay: 0.01, gold: false },
  { dx: 8, dy: 62, size: 3, delay: 0.05, gold: true },
  { dx: -60, dy: 32, size: 2.3, delay: 0.03, gold: false },
  { dx: 52, dy: 36, size: 2.8, delay: 0.08, gold: true },
  { dx: -10, dy: -50, size: 2.4, delay: 0.04, gold: false },
  { dx: 30, dy: -30, size: 2.6, delay: 0.06, gold: true },
  { dx: -40, dy: 14, size: 2.7, delay: 0.02, gold: false },
  { dx: 12, dy: 40, size: 2.5, delay: 0.07, gold: true },
  { dx: -24, dy: -8, size: 2.9, delay: 0.09, gold: false },
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

    /*
     * Re-bind with an explicit non-null type.
     *
     * TypeScript's control-flow narrowing above
     * does not carry into nested closures
     * (resize/render/etc. defined further down),
     * so without this every canvas./ctx. access
     * inside those closures is falsely flagged
     * as possibly null.
     */
    const safeCanvas: HTMLCanvasElement = canvas;
    const safeCtx: CanvasRenderingContext2D = ctx;

    let animationFrame = 0;

    let completionTimer:
      | number
      | undefined;

    let hasCompleted = false;

    /*
  * FULL-SCREEN RIPPLE REVEAL
  * ---------------------------------------------
  * Particles no longer all appear at once. Each
  * particle fades in over INTRO_REVEAL_BASE ms,
  * but starts that fade at its own delay based on
  * how far it is from the screen center — nearest
  * particles bloom in first, farthest (edges/
  * corners) bloom in last, up to
  * INTRO_REVEAL_STAGGER ms later. The result reads
  * as a soft wave of light expanding outward to
  * fill the ENTIRE screen before the vortex starts
  * pulling everything into the center.
  *
  * NOTE: these durations (and VORTEX_DURATION below)
  * were increased from their original values to slow
  * the overall intro down — the brand-reveal delays
  * further down in this file were scaled by the same
  * ~1.4x factor so everything stays in sync.
  */
    const INTRO_REVEAL_BASE =
      640;

    const INTRO_REVEAL_STAGGER =
      580;

    const INTRO_REVEAL_DURATION =
      INTRO_REVEAL_BASE +
      INTRO_REVEAL_STAGGER;

    const VORTEX_DURATION =
      2240;

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

      /*
       * Per-particle collapse-curve exponent. Varying
       * this (instead of one fixed exponent for every
       * particle) is what makes each particle travel at
       * its own individual pace rather than the whole
       * field moving as one uniform mass.
       */
      speedPower: number;

      /*
       * Mutated every frame to draw a short motion
       * trail behind fast-moving glow particles.
       * Undefined until the particle has rendered once.
       */
      prevX?: number;

      prevY?: number;
    };

    let particles:
      Particle[] = [];

    let viewportWidth = 0;
    let viewportHeight = 0;

    /* =========================================
       PARTICLE CREATION
       Particles are laid out on a grid, then
       masked to an ELLIPSE (not a full
       rectangle). This is what makes the
       convergence collapse into a round shape
       instead of a "box" — every particle that
       would have started in a screen corner is
       simply never created.
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
       *
       * We generate a bit more than the target
       * count because the ellipse mask below
       * discards corner particles (~22% of a
       * rectangle's area sits outside its
       * inscribed ellipse) — this keeps the
       * on-screen density the same as before.
       */
      let baseParticleCount: number;

      if (isMobile) {
        baseParticleCount =
          logicalCores <= 4
            ? 1500
            : 2100;
      } else {
        baseParticleCount =
          logicalCores <= 4
            ? 2700
            : 3800;
      }

      const centerX =
        width / 2;

      const centerY =
        height / 2;

      /*
       * ROUND-SHAPE CONTROL
       * ---------------------------------------------
       * Pehle ellipseA (width/2) aur ellipseB (height/2)
       * alag-alag the — jab screen wide hoti hai (width
       * != height) to yahi mismatch "anda" (egg) shape
       * banata tha, kyunki mask khud oval tha.
       *
       * Fix: dono axes ka radius EXACTLY same rakho —
       * screen ki chhoti dimension (width ya height, jo
       * bhi kam ho) ke aadhar par. Isse mask ek TRUE
       * CIRCLE banta hai, egg nahi.
       *
       * scaleFactor thoda bada kiya hai (1.18) taaki
       * circle screen ke edges tak achhe se fill kare —
       * chaho to isse 1 ke kareeb la ke chhota, ziyada
       * tight circle bhi bana sakte ho.
       */
      const scaleFactor = 1.5;

      const circleRadius =
        (Math.min(
          width,
          height,
        ) /
          2) *
        scaleFactor;



      const ellipseA =
        (width / 2) * scaleFactor;

      const ellipseB =
        (height / 2) * scaleFactor;

      /*
       * Circle ka area rectangle se chhota hota hai, is
       * liye density same rakhne ke liye particle count
       * ko us area-ratio se compensate karte hain —
       * warna circle ke andar particles "sparse" lagenge.
       */
      const circleArea =
        Math.PI *
        circleRadius *
        circleRadius;

      const rectArea =
        width * height;

      const areaRatio =
        Math.min(
          Math.max(
            circleArea /
            rectArea,
            0.25,
          ),
          1,
        );

      const particleCount =
        Math.round(
          baseParticleCount /
          areaRatio,
        );

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

            const dx =
              startX -
              centerX;

            const dy =
              startY -
              centerY;

            /*
             * Normalized ellipse distance:
             * 0 = center, 1 = right on the
             * ellipse boundary, >1 = outside
             * (corner) → dropped.
             */
            const normalizedDist =
              Math.sqrt(
                (dx / ellipseA) *
                (dx / ellipseA) +
                (dy / ellipseB) *
                (dy / ellipseB),
              );

            if (
              normalizedDist >
              1
            ) {
              return null;
            }

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
               * Kept for compatibility but no longer
               * used to rotate the particle — movement
               * is now a straight line into the center.
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
               * WIDE, ONE-BY-ONE STAGGER
               * ---------------------------------------------
               * Pehle delay sirf 0-110ms tha — VORTEX_DURATION
               * (2430ms) ke saamne itna chhota tha ki 99%
               * particles almost same instant pe move karna
               * shuru kar dete the. Isi wajah se poora field
               * ek solid round "ball" ki tarah ek saath center
               * ki taraf jaata dikhta tha.
               *
               * Ab delay ko VORTEX_DURATION ke ek bade hisse
               * (60%) tak spread kiya hai, with a bias toward
               * earlier starts (Math.random() squared) so most
               * particles still start reasonably soon, but a
               * long, visible tail of particles keeps trickling
               * in one after another well into the animation —
               * each particle clearly begins its own journey at
               * its own moment instead of everything launching
               * together.
               */
              delay:
                Math.pow(
                  Math.random(),
                  1.6,
                ) *
                VORTEX_DURATION *
                0.6,

              /*
               * Per-particle collapse-curve exponent (varies
               * how a particle accelerates inward). Random
               * range gives each particle its own individual
               * pace/feel instead of one uniform motion curve
               * for every single particle.
               */
              speedPower:
                0.82 +
                Math.random() *
                0.85,

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
        ).filter(
          (
            particle,
          ): particle is Particle =>
            particle !== null,
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

      safeCanvas.width =
        Math.round(
          viewportWidth * dpr,
        );

      safeCanvas.height =
        Math.round(
          viewportHeight * dpr,
        );

      safeCanvas.style.width =
        `${viewportWidth}px`;

      safeCanvas.style.height =
        `${viewportHeight}px`;

      safeCtx.setTransform(
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

      /*
       * Bigger, layered glow so the transition into
       * the logo feels like the particles genuinely
       * fused into a light source, not a small dot.
       */
      const radius =
        34 +
        visibility *
        86;

      const gradient =
        safeCtx.createRadialGradient(
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
          250,
          232,
          ${0.34 *
        visibility
        }
        )`,
      );

      gradient.addColorStop(
        0.12,
        `rgba(
          255,
          236,
          190,
          ${0.26 *
        visibility
        }
        )`,
      );

      gradient.addColorStop(
        0.32,
        `rgba(
          247,
          198,
          104,
          ${0.16 *
        visibility
        }
        )`,
      );

      gradient.addColorStop(
        0.62,
        `rgba(
          224,
          158,
          58,
          ${0.06 *
        visibility
        }
        )`,
      );

      gradient.addColorStop(
        1,
        "rgba(0,0,0,0)",
      );

      safeCtx.globalAlpha = 1;

      safeCtx.fillStyle =
        gradient;

      safeCtx.beginPath();

      safeCtx.arc(
        centerX,
        centerY,
        radius,
        0,
        TWO_PI,
      );

      safeCtx.fill();

      /*
       * Soft secondary halo — wider and fainter,
       * gives the glow depth instead of a hard edge.
       */
      const haloRadius =
        radius * 1.9;

      const haloGradient =
        safeCtx.createRadialGradient(
          centerX,
          centerY,
          radius * 0.4,

          centerX,
          centerY,
          haloRadius,
        );

      haloGradient.addColorStop(
        0,
        `rgba(
          255,
          224,
          160,
          ${0.1 *
        visibility
        }
        )`,
      );

      haloGradient.addColorStop(
        1,
        "rgba(0,0,0,0)",
      );

      safeCtx.fillStyle =
        haloGradient;

      safeCtx.beginPath();

      safeCtx.arc(
        centerX,
        centerY,
        haloRadius,
        0,
        TWO_PI,
      );

      safeCtx.fill();

      /*
       * Hot, bright white-gold center — this is what
       * the logo will visually "sit on top of".
       */
      const coreSize =
        6 +
        visibility * 12;

      safeCtx.fillStyle =
        `rgba(
          255,
          252,
          240,
          ${0.92 *
        visibility
        }
        )`;

      safeCtx.beginPath();

      safeCtx.arc(
        centerX,
        centerY,
        coreSize,
        0,
        TWO_PI,
      );

      safeCtx.fill();
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

      safeCtx.clearRect(
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
      // Instant full-screen galaxy look: koi fade/stagger nahi,
      // pehle hi frame se sab particles full opacity par.
      const revealProgress = 1;

      // Rotation/convergence turant shuru — koi wait nahi.
      const vortexElapsed = elapsed;

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
      safeCtx.save();

      safeCtx.globalCompositeOperation =
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
         * Radius continuously gets smaller. The exponent
         * is now per-particle (speedPower) instead of one
         * fixed value for every particle — this is a big
         * part of why particles now feel like they're each
         * traveling on their own, rather than the whole
         * field moving in perfect unison.
         */
        const radius =
          particle.startRadius *
          Math.pow(
            1 - pull,
            particle.speedPower,
          );

        /*
         * TRUE ROTATING VORTEX
         * ---------------------------------------------
         * Every particle now rotates around the center
         * in the SAME direction as it moves inward
         * (like water going down a drain), instead of
         * sliding in on a straight rail. Rotation speed
         * ramps up smoothly as the particle gets closer
         * to the center (pull), so it starts as a gentle
         * curve and tightens into a fast spin right
         * before it fuses into the glow.
         *
         * SPIRAL_TURNS controls how many full rotations
         * (in units of 360°) a particle completes over
         * its whole journey — raise it for a tighter,
         * more obviously "spinning" vortex; lower it for
         * a gentler curve.
         */
        const SPIRAL_TURNS = 0.85;

        const spiralProgress =
          Math.pow(
            pull,
            1.35,
          );

        const angle =
          particle.startAngle +
          spiralProgress *
          SPIRAL_TURNS *
          TWO_PI;

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
         * COMET TRAIL — glow particles only
         * ---------------------------------------------
         * Draws a short fading streak from where the
         * particle was last frame to where it is now.
         * Only kicks in once a particle is actually
         * moving with some speed (pull > 0.03), so
         * particles still waiting for their turn (static,
         * pull = 0) show no trail at all — the trail
         * itself reinforces the "individual particle
         * traveling on its own" feel, and gives the
         * whole thing a more premium, cinematic quality.
         */
        if (
          particle.glow &&
          pull >
          0.03 &&
          particle.prevX !==
          undefined &&
          particle.prevY !==
          undefined
        ) {
          const trailDx =
            x -
            particle.prevX;

          const trailDy =
            y -
            particle.prevY;

          const trailLength =
            Math.sqrt(
              trailDx *
              trailDx +
              trailDy *
              trailDy,
            );

          if (
            trailLength >
            0.4
          ) {
            const trailGradient =
              safeCtx.createLinearGradient(
                particle.prevX,
                particle.prevY,
                x,
                y,
              );

            trailGradient.addColorStop(
              0,
              "rgba(255, 218, 136, 0)",
            );

            trailGradient.addColorStop(
              1,
              `rgba(255, 236, 190, ${alpha * 0.55
              })`,
            );

            safeCtx.strokeStyle =
              trailGradient;

            safeCtx.lineWidth =
              Math.max(
                0.6,
                size * 0.9,
              );

            safeCtx.lineCap =
              "round";

            safeCtx.beginPath();

            safeCtx.moveTo(
              particle.prevX,
              particle.prevY,
            );

            safeCtx.lineTo(
              x,
              y,
            );

            safeCtx.stroke();
          }
        }

        particle.prevX = x;

        particle.prevY = y;

        /*
         * Main golden particle.
         *
         * fillRect is dramatically cheaper
         * than thousands of arc + shadowBlur
         * operations and at this tiny size
         * still visually reads as a dot.
         */
        safeCtx.globalAlpha =
          alpha;

        safeCtx.fillStyle =
          particle.glow
            ? "#fff1c7"
            : "#f6c86f";

        safeCtx.fillRect(
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

          safeCtx.globalAlpha =
            alpha * 0.28;

          safeCtx.fillStyle =
            "#ffda88";
          safeCtx.fillRect(
            x -
            glowSize / 2,
            y -
            glowSize / 2,
            glowSize,
            glowSize,
          );
        }
      }

      safeCtx.restore();

      safeCtx.globalAlpha = 1;

      if (elapsed < TOTAL_DURATION) {
        animationFrame = requestAnimationFrame(render);
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
        /*
         * Was 0.18s — too fast, so the glow vanished
         * almost the instant the logo started fading
         * in, reading as a hard cut instead of "logo
         * appears on top of the glow". Slowed down to
         * roughly match the logo's own reveal duration
         * (0.85s below) so they cross-fade together:
         * the glow lingers under the logo and only
         * fully disappears once the logo has settled.
         */
        duration: 0.95,
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
  minimumDuration = 10000,
  onDone,
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
        onDone?.();
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
        9300,
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
          className={`${styles.preloader} ${isLeaving
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
                scale: 1.18,
                filter:
                  "blur(20px) brightness(1.7)",
              }}
              animate={
                isLeaving
                  ? {
                    opacity: 1,
                    scale: 1.3,
                    filter:
                      "blur(0px) brightness(1.15)",
                  }
                  : particleIntroDone
                    ? {
                      opacity: 1,
                      scale: 1,
                      filter:
                        "blur(0px) brightness(1)",
                    }
                    : {
                      opacity: 0,
                      scale: 1.18,
                      filter:
                        "blur(20px) brightness(1.7)",
                    }
              }
              transition={{
                duration:
                  isLeaving ? 0.7 : 0.85,
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

                  delay: 3.5,

                  repeat:
                    Infinity,

                  ease:
                    "easeInOut",
                }}
              >
                {/* MATERIALIZE BURST — fires the instant
                    particles finish converging, giving the
                    impression the particle energy itself
                    becomes the image */}

                <AnimatePresence>
                  {particleIntroDone && (
                    <>
                      <motion.span
                        className={
                          styles.materializeFlash
                        }
                        initial={{
                          opacity: 0.95,
                          scale: 0.25,
                        }}
                        animate={{
                          opacity: 0,
                          scale: 1.7,
                        }}
                        transition={{
                          duration: 0.7,
                          ease: "easeOut",
                        }}
                        aria-hidden="true"
                      />

                      <motion.span
                        className={
                          styles.materializeRing
                        }
                        initial={{
                          opacity: 0.9,
                          scale: 0.3,
                        }}
                        animate={{
                          opacity: 0,
                          scale: 2.5,
                        }}
                        transition={{
                          duration: 0.85,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}
                        aria-hidden="true"
                      />

                      <motion.span
                        className={
                          styles.materializeRing
                        }
                        style={{
                          borderColor:
                            "rgba(101, 217, 228, 0.4)",
                        }}
                        initial={{
                          opacity: 0.7,
                          scale: 0.3,
                        }}
                        animate={{
                          opacity: 0,
                          scale: 1.9,
                        }}
                        transition={{
                          duration: 0.65,
                          delay: 0.08,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}
                        aria-hidden="true"
                      />

                      {MATERIALIZE_SPARKS.map(
                        (
                          spark,
                          index,
                        ) => (
                          <motion.span
                            key={
                              index
                            }
                            className={
                              styles.materializeSpark
                            }
                            style={{
                              width: `${spark.size}px`,
                              height: `${spark.size}px`,
                              marginLeft: `${-spark.size / 2
                                }px`,
                              marginTop: `${-spark.size / 2
                                }px`,
                              background:
                                spark.gold
                                  ? "#ffe9bd"
                                  : "#c8f8ff",
                            }}
                            initial={{
                              x: 0,
                              y: 0,
                              opacity: 1,
                              scale: 1.4,
                            }}
                            animate={{
                              x: spark.dx,
                              y: spark.dy,
                              opacity: 0,
                              scale: 0.3,
                            }}
                            transition={{
                              duration: 0.75,
                              delay:
                                spark.delay,
                              ease: "easeOut",
                            }}
                            aria-hidden="true"
                          />
                        ),
                      )}
                    </>
                  )}
                </AnimatePresence>

                <div
                  className={
                    styles.assembleWipe
                  }
                >
                  {/* AMBIENT GLOW-DOTS BEHIND THE SVG EMBLEM
                      Rendered first (so it sits below the
                      emblem in stacking order) and only once
                      the convergence has finished, so it reads
                      as part of the emblem's "premium" glow
                      rather than leftover convergence dust. */}
                  {particleIntroDone && (
                    <div
                      className={
                        styles.emblemBgParticles
                      }
                      aria-hidden="true"
                    >
                      {EMBLEM_BG_PARTICLES.map(
                        (
                          particle,
                          index,
                        ) => (
                          <motion.span
                            key={
                              index
                            }
                            className={
                              styles.emblemBgParticle
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
                            initial={{
                              opacity: 0,
                              scale: 0.6,
                            }}
                            animate={{
                              opacity: [
                                0.15,
                                0.55,
                                0.15,
                              ],
                              scale: [
                                0.7,
                                1.25,
                                0.7,
                              ],
                            }}
                            transition={{
                              opacity: {
                                duration:
                                  particle.duration,
                                delay:
                                  particle.delay,
                                repeat:
                                  Infinity,
                                ease:
                                  "easeInOut",
                              },
                              scale: {
                                duration:
                                  particle.duration,
                                delay:
                                  particle.delay,
                                repeat:
                                  Infinity,
                                ease:
                                  "easeInOut",
                              },
                            }}
                          />
                        ),
                      )}
                    </div>
                  )}


                  <EmblemPreloader active={particleIntroDone} />
                </div>

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
                delay: 1.0,
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
                    3.47,

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
                    3.99,

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
                    4.23,

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
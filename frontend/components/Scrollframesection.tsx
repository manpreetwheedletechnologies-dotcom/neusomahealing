"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* ======================================================================
   CONFIG — apni real video-frames ke hisaab se yahan badlo
   ======================================================================
   1. Video ko frames mein todo:
        ffmpeg -i input.mp4 -vf fps=30,scale=1600:-1 public/images/scroll-sequence/frame_%04d.jpg
   2. FRAME_COUNT ko total frame count se replace karo
   3. FRAME_PATH ko apne folder/naming pattern se match karo
   ====================================================================== */
const FRAME_COUNT = 120;
const FRAME_PATH = (index: number) =>
  `/images/scroll-sequence/frame_${String(index + 1).padStart(4, "0")}.jpg`;

const ease = [0.22, 1, 0.36, 1] as const;

// Hero ka background jahan se shuru hota hai, PauseSection ka background jahan pe khatam
const BG_START = "#f6f1e8"; // Hero
const BG_END = "#f2ece2"; // PauseSection

export function ScrollFrameSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const eyebrowOpacity = useTransform(scrollYProgress, [0, 0.08, 0.9, 1], [0, 1, 1, 0]);
  const eyebrowY = useTransform(scrollYProgress, [0, 0.08], [16, 0]);
  const backgroundColor = useTransform(scrollYProgress, [0, 1], [BG_START, BG_END]);

  /* ---------------- preload frames ---------------- */
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new window.Image();
      img.src = FRAME_PATH(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        loadedCount += 1;
        setLoadPct(Math.round((loadedCount / FRAME_COUNT) * 100));
        if (loadedCount === FRAME_COUNT) setLoaded(true);
      };
      imgs[i] = img;
    }
    imagesRef.current = imgs;

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- draw current frame (cover-fit) ---------------- */
  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    let drawW = cw;
    let drawH = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
      offsetX = (cw - drawW) / 2;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
      offsetY = (ch - drawH) / 2;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  };

  /* ---------------- scroll -> frame index (rAF-throttled) ---------------- */
  useEffect(() => {
    if (!loaded) return;

    const update = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const total = wrapper.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / total, 0), 1);

      const nextFrame = Math.round(progress * (FRAME_COUNT - 1));
      if (nextFrame !== frameRef.current) {
        frameRef.current = nextFrame;
        draw(nextFrame);
      }
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    draw(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded]);

  return (
    <motion.section
      ref={wrapperRef}
      id="watch"
      style={{ backgroundColor }}
      className="relative h-[400vh] w-full"
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* canvas frame sequence */}
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease" }}
        />

        {/* text overlay, matches Hero/PauseSection eyebrow + serif style */}
        <motion.div
          style={{ opacity: eyebrowOpacity, y: eyebrowY }}
          className="pointer-events-none absolute bottom-[8vh] left-1/2 -translate-x-1/2 text-center"
        >
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#f2ece2]">
            The Shift
          </p>
          <p className="font-serif text-[15px] font-medium leading-[1.3] text-[#f2ece2]">
            Every movement, a moment of change.
          </p>
        </motion.div>

        {/* loading state */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f2ece2]">
            <div className="h-px w-[120px] overflow-hidden bg-[#d6c7b3]">
              <div
                className="h-full bg-[#ad7638] transition-[width] duration-200 ease-out"
                style={{ width: `${loadPct}%` }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#59645e]">
              {loadPct}%
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}
"use client";

import { motion } from "framer-motion";

export function BreathingPause() {
  return (
    <div
      className="relative grid h-[270px] w-[270px] place-items-center max-[700px]:mx-auto max-[700px]:my-[45px]"
      aria-label="Gentle breathing visual"
    >
      <motion.div
        className="grid h-[190px] w-[190px] place-items-center rounded-full border border-[#a9b9a9] bg-[radial-gradient(circle,#dbe6d8,transparent_65%)] shadow-[0_0_80px_#b8c9b966]"
        animate={{ scale: [0.82, 1.06, 0.82] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-[45px] w-[45px] rounded-full bg-[#7f9c8c] shadow-[0_0_25px_#7f9c8c88] blur-[2px]" />
      </motion.div>
      <div className="absolute inset-0 flex flex-col items-center justify-between py-[45px] text-[9px] tracking-[.2em] text-[#64736a]">
        <span>INHALE</span>
        <i className="h-[70px] w-px bg-[#aebcb2] not-italic" />
        <span>EXHALE</span>
      </div>
    </div>
  );
}

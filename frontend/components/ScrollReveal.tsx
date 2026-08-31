"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Direction = "left" | "right" | "up" | "down" | "fade";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  distance?: number;
  duration?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  distance = 60,
  duration = 0.7,
  once = true,
}: ScrollRevealProps) {
  const getInitial = () => {
    switch (direction) {
      case "left":
        return { opacity: 0, x: -distance, y: 0 };
      case "right":
        return { opacity: 0, x: distance, y: 0 };
      case "down":
        return { opacity: 0, x: 0, y: -distance };
      case "up":
        return { opacity: 0, x: 0, y: distance };
      case "fade":
        return { opacity: 0, x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { usePreloaderDone } from "./PreloaderGate";

export function PageReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDone = usePreloaderDone();

  return (
    <motion.div
      style={{
        transformOrigin: "center center",
      }}
      initial={{
        opacity: 0,
        scale: 1.14,
        filter: "blur(14px)",
      }}
      animate={
        isDone
          ? {
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
            }
          : {
              opacity: 0,
              scale: 1.14,
              filter: "blur(14px)",
            }
      }
      transition={
        isDone
          ? {
              opacity: {
                duration: 0.9,
                delay: 0.1,
                ease: "easeOut",
              },
              filter: {
                duration: 1.1,
                delay: 0.1,
                ease: "easeOut",
              },
              scale: {
                duration: 1.3,
                delay: 0.1,
                // Thoda overshoot ke saath settle hota hai —
                // isse "zoom-out" premium/cinematic lagta hai,
                // flat linear zoom se zyada.
                ease: [0.16, 1, 0.3, 1],
              },
            }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}
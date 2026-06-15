import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { playIntroMusic, stopIntroMusic } from "@/utils/audio";

export function CinematicIntro({ onEnter }: { onEnter: () => void }) {
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") trigger();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ready]);

  const trigger = () => {
    if (exiting) return;
    setExiting(true);
    playIntroMusic();
    setTimeout(() => {
      stopIntroMusic();
      onEnter();
    }, 900);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0 z-30 grid place-items-center bg-black"
          onClick={() => ready && trigger()}
        >
          {/* radial glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(168,85,247,0.35), transparent 55%), radial-gradient(ellipse at center, rgba(34,211,238,0.25), transparent 70%)",
            }}
          />
          {/* scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                "repeating-linear-gradient(transparent 0 2px, rgba(255,255,255,0.06) 2px 3px)",
            }}
          />

          <div className="relative text-center px-6">
            {/* logo reveal */}
            <motion.div
              initial={{ opacity: 0, y: 30, letterSpacing: "0.6em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.3em" }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-xs uppercase text-neon-cyan"
            >
              Virtua Gallery presents
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 font-display text-5xl md:text-7xl font-black tracking-tight neon-text"
            >
              The Virtual Museum
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.9 }}
              className="mx-auto mt-6 h-px w-48 origin-center bg-gradient-to-r from-transparent via-neon-purple to-transparent"
            />
            <AnimatePresence>
              {ready && (
                <motion.button
                  key="enter"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  onClick={trigger}
                  className="mt-10 inline-flex items-center gap-3 rounded-full glass-strong px-7 py-3 text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition"
                >
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="text-neon-cyan"
                  >
                    Press Enter
                  </motion.span>
                  <span className="text-muted-foreground">to Explore</span>
                </motion.button>
              )}
              {!ready && (
                <motion.div
                  key="loading"
                  exit={{ opacity: 0 }}
                  className="mt-10 mx-auto h-0.5 w-48 overflow-hidden rounded-full bg-white/10"
                >
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

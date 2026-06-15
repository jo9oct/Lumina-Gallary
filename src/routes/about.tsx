import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Virtua Gallery" },
      { name: "description", content: "About the Virtua Gallery virtual museum experience." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-5xl md:text-6xl font-black neon-text"
      >
        About Virtua Gallery
      </motion.h1>
      <div className="mt-8 space-y-5 text-lg text-foreground/85 leading-relaxed">
        <p>
          Virtua Gallery is a frontend-only experiment in browser-native museum design.
          Every wall, light, and artwork lives entirely in your tab — no servers, no accounts,
          no databases.
        </p>
        <p>
          It's built on React, Vite, Tailwind, Three.js (with React Three Fiber and Drei),
          Framer Motion, and the humble browser Local Storage. Favorites and view history are
          stored on your device.
        </p>
        <p>
          Walk through the gallery with <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-sm">W A S D</kbd>,
          look around with the mouse, and click any frame to open a cinematic detail view
          with audio narrations and video.
        </p>
      </div>
      <div className="mt-12 grid sm:grid-cols-3 gap-3">
        {[
          { k: "Stack", v: "React · Vite · Three.js" },
          { k: "Storage", v: "Browser Local" },
          { k: "Mode", v: "100% frontend" },
        ].map((s) => (
          <div key={s.k} className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.k}</div>
            <div className="mt-1 font-display text-lg font-semibold">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

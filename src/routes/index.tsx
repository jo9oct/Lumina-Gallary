import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Box, Palette } from "lucide-react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { useGallery } from "@/context/GalleryContext";
import { ROOMS } from "@/data/artworks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Virtua Gallery — Enter the 3D Virtual Museum" },
      { name: "description", content: "A cinematic, frontend-only 3D virtual art gallery. Walk, explore, and interact with curated artworks." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { artworks } = useGallery();
  const featured = artworks.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-6">
      {/* HERO */}
      <section className="relative pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground"
        >
          <Sparkles className="h-3 w-3 text-neon-cyan" />
          A Cinematic 3D Exhibition
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight"
        >
          A <span className="neon-text">virtual museum</span>
          <br /> rendered in your browser.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground"
        >
          Step into a cinematic 3D art gallery. Walk between rooms, study each piece up close,
          and unlock audio narrations, videos and detailed annotations on every artwork.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/gallery"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 py-3 text-sm font-medium text-white shadow-xl shadow-neon-purple/40 hover:scale-105 transition"
          >
            Enter Gallery <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <a href="#featured" className="inline-flex items-center gap-2 rounded-full glass px-7 py-3 text-sm font-medium hover:bg-white/5">
            Explore Artworks
          </a>
        </motion.div>

        {/* floating hero preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-neon-purple/40 via-neon-blue/30 to-neon-cyan/40 blur-3xl animate-glow-pulse" />
          <div className="relative grid grid-cols-3 gap-3 rounded-3xl glass-strong p-3 neon-border">
            {featured.slice(0, 3).map((a, i) => (
              <motion.div
                key={a.id}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.4 }}
                className="aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <img src={a.image} alt={a.title} className="h-full w-full object-cover" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Curated Works", value: artworks.length },
          { label: "Gallery Rooms", value: ROOMS.length },
          { label: "Audio Tracks", value: artworks.filter((a) => a.audio).length },
          { label: "Video Tours", value: artworks.filter((a) => a.video).length },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-6 text-center"
          >
            <div className="font-display text-4xl font-bold neon-text">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* ROOMS */}
      <section className="mt-24">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Five distinct rooms</h2>
          <Link to="/gallery" className="text-sm text-neon-cyan hover:underline">Walk through →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ROOMS.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl glass p-5 hover:neon-border transition"
            >
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full blur-3xl opacity-50" style={{ background: r.color }} />
              <Palette className="h-5 w-5 mb-3" style={{ color: r.color }} />
              <div className="font-display font-semibold">{r.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {artworks.filter((a) => a.room === r.id).length} works
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="mt-24">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Featured works</h2>
          <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Box className="h-4 w-4" /> Tap any to open
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((a, i) => (
            <ArtworkCard key={a.id} artwork={a} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

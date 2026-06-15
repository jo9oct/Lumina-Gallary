import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useGallery } from "@/context/GalleryContext";
import { FavoriteButton } from "./FavoriteButton";

export function ArtworkModal() {
  const { selected, setSelected, artworks } = useGallery();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, setSelected]);

  const related = selected
    ? artworks.filter((a) => a.room === selected.room && a.id !== selected.id).slice(0, 4)
    : [];

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-xl p-4"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl glass-strong neon-border"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 rounded-full glass p-2 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid lg:grid-cols-[1.2fr_1fr]">
              <div className="relative bg-black/60 overflow-hidden">
                <div className="relative aspect-square lg:aspect-auto lg:h-full grid place-items-center p-6">
                  <motion.img
                    src={selected.image}
                    alt={selected.title}
                    style={{ scale: zoom }}
                    transition={{ type: "spring", damping: 20 }}
                    className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
                  />
                </div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="rounded-full glass p-2 hover:bg-white/10">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))} className="rounded-full glass p-2 hover:bg-white/10">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-7 lg:p-9 space-y-5">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-neon-cyan">{selected.category} · {selected.room}</span>
                  <h2 className="mt-2 font-display text-3xl font-bold leading-tight">{selected.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.artist} · {selected.year}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">{selected.description}</p>
                <div className="flex flex-wrap gap-2">
                  <FavoriteButton id={selected.id} />
                </div>
                {selected.audio && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Audio narration</p>
                    <audio controls src={selected.audio} className="w-full" />
                  </div>
                )}
                {selected.video && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Video</p>
                    <div className="aspect-video overflow-hidden rounded-xl border border-border">
                      <iframe
                        src={selected.video}
                        title={selected.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
                {related.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Related works</p>
                    <div className="grid grid-cols-4 gap-2">
                      {related.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setSelected(a)}
                          className="aspect-square overflow-hidden rounded-lg ring-1 ring-border hover:ring-neon-purple/60 transition"
                        >
                          <img src={a.image} alt={a.title} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

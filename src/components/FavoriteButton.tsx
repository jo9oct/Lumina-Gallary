import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGallery } from "@/context/GalleryContext";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const { isFav, toggleFavorite } = useGallery();
  const active = isFav(id);
  const [burst, setBurst] = useState(0);

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!active) setBurst((n) => n + 1);
    toggleFavorite(id);
  };

  return (
    <button
      onClick={handle}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium transition-all hover:scale-105 overflow-visible",
        active && "text-neon-purple",
        className,
      )}
    >
      <span className="relative grid place-items-center">
        <motion.span
          key={active ? "on" : "off"}
          initial={{ scale: active ? 0.5 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 14 }}
        >
          <Heart className={cn("h-3.5 w-3.5 transition", active && "fill-current")} />
        </motion.span>
        <AnimatePresence>
          {burst > 0 && (
            <motion.span
              key={burst}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              onAnimationComplete={() => setBurst(0)}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.cos(angle) * 22;
                const y = Math.sin(angle) * 22;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-neon-purple"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x, y, opacity: 0, scale: 0.2 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ boxShadow: "0 0 8px var(--neon-purple)" }}
                  />
                );
              })}
              <motion.span
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(168,85,247,0.7), transparent 70%)" }}
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {active ? "Favorited" : "Favorite"}
    </button>
  );
}

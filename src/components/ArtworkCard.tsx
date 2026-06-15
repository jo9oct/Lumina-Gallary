import { motion } from "framer-motion";
import type { Artwork } from "@/data/artworks";
import { FavoriteButton } from "./FavoriteButton";
import { useGallery } from "@/context/GalleryContext";

export function ArtworkCard({ artwork, index = 0 }: { artwork: Artwork; index?: number }) {
  const { setSelected } = useGallery();
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      onClick={() => setSelected(artwork)}
      className="group text-left overflow-hidden rounded-2xl glass hover:neon-border transition-all"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={artwork.image}
          alt={artwork.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="rounded-full glass-strong px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {artwork.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <FavoriteButton id={artwork.id} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg font-semibold">{artwork.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {artwork.artist} · {artwork.year}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

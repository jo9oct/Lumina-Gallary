import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { useGallery } from "@/context/GalleryContext";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites · Virtua Gallery" },
      { name: "description", content: "Your saved favorite artworks from the virtual gallery." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { artworks, favorites } = useGallery();
  const list = artworks.filter((a) => favorites.includes(a.id));
  return (
    <div className="mx-auto max-w-7xl px-6">
      <h1 className="font-display text-4xl md:text-5xl font-bold">Favorites</h1>
      <p className="mt-2 text-muted-foreground">Pieces you've marked while exploring the gallery.</p>
      {list.length === 0 ? (
        <div className="mt-16 grid place-items-center text-center glass rounded-3xl p-16">
          <Heart className="h-10 w-10 text-neon-purple mb-4" />
          <h2 className="font-display text-2xl font-semibold">No favorites yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Tap the heart on any artwork to save it here for later viewing.
          </p>
          <Link to="/gallery" className="mt-6 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 py-2 text-sm font-medium text-white">
            Visit gallery
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((a, i) => <ArtworkCard key={a.id} artwork={a} index={i} />)}
        </div>
      )}
    </div>
  );
}

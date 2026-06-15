import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { useGallery } from "@/context/GalleryContext";

export const Route = createFileRoute("/recent")({
  head: () => ({
    meta: [
      { title: "Recently Viewed · Virtua Gallery" },
      { name: "description", content: "Your recently viewed artworks." },
    ],
  }),
  component: RecentPage,
});

function RecentPage() {
  const { artworks, recent } = useGallery();
  const list = recent.map((id) => artworks.find((a) => a.id === id)).filter(Boolean) as typeof artworks;
  return (
    <div className="mx-auto max-w-7xl px-6">
      <h1 className="font-display text-4xl md:text-5xl font-bold">Recently Viewed</h1>
      <p className="mt-2 text-muted-foreground">A trail of the works you've stopped to look at.</p>
      {list.length === 0 ? (
        <div className="mt-16 grid place-items-center text-center glass rounded-3xl p-16">
          <Clock className="h-10 w-10 text-neon-cyan mb-4" />
          <h2 className="font-display text-2xl font-semibold">Nothing here yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">Visit the gallery and open an artwork to start your history.</p>
          <Link to="/gallery" className="mt-6 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 py-2 text-sm font-medium text-white">
            Enter the gallery
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

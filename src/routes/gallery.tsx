import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

const GalleryScene = lazy(() => import("@/three/GalleryScene").then((m) => ({ default: m.GalleryScene })));

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "3D Gallery · Virtua Gallery" },
      { name: "description", content: "Walk through the immersive 3D virtual art gallery using WASD and mouse." },
    ],
  }),
  component: GalleryPage,
  ssr: false,
});

function GalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <Suspense fallback={<LoadingScreen label="Loading gallery..." />}>
        <GalleryScene />
      </Suspense>
    </div>
  );
}

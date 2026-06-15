import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { GalleryProvider } from "@/context/GalleryContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArtworkModal } from "@/components/ArtworkModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CustomCursor } from "@/components/CustomCursor";
import { SearchOverlay } from "@/components/SearchOverlay";
import { Toaster } from "react-hot-toast";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong p-10 rounded-3xl neon-border">
        <h1 className="font-display text-8xl font-black neon-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Gallery wing not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This corridor doesn't exist. Return to the main hall.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 py-2 text-sm font-medium text-white shadow-lg shadow-neon-purple/30"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong p-10 rounded-3xl">
        <h1 className="text-xl font-semibold">Something broke in the gallery</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Virtua Gallery — A 3D Virtual Museum Experience" },
      { name: "description", content: "Walk through a cinematic 3D virtual art gallery in your browser. Interactive artworks, audio narrations and immersive lighting." },
      { property: "og:title", content: "Virtua Gallery" },
      { property: "og:description", content: "Cinematic 3D virtual art gallery in your browser." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <GalleryProvider>
        <AnimatedBackground />
        <CustomCursor />
        <Navbar />
        <main className="pt-24">
          <Outlet />
        </main>
        <Footer />
        <ArtworkModal />
        <SearchOverlay />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(15,12,28,0.9)",
              color: "#fff",
              border: "1px solid rgba(168,85,247,0.4)",
              backdropFilter: "blur(20px)",
            },
          }}
        />
      </GalleryProvider>
    </QueryClientProvider>
  );
}

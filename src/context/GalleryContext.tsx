import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ARTWORKS, type Artwork } from "@/data/artworks";
import {
  addRecentView,
  getFavorites,
  getRecent,
  removeFavorite,
  saveFavorite,
} from "@/utils/storage";
import { idbDelete, idbList, idbPut, type StoredArtwork } from "@/utils/idb";
import { trackEvent } from "@/utils/achievements";

export type NewArtworkInput = {
  title: string;
  artist: string;
  year: number;
  category: string;
  description: string;
  room: Artwork["room"];
  imageFile: File;
  mediaType: "audio" | "video" | null;
  mediaFile: File | null;
  tags?: string[];
};

type Ctx = {
  artworks: Artwork[];
  customArtworks: Artwork[];
  favorites: string[];
  recent: string[];
  selected: Artwork | null;
  setSelected: (a: Artwork | null) => void;
  toggleFavorite: (id: string) => void;
  isFav: (id: string) => boolean;
  addArtwork: (input: NewArtworkInput) => Promise<void>;
  updateArtwork: (id: string, input: NewArtworkInput) => Promise<void>;
  removeArtwork: (id: string) => Promise<void>;
  refreshCustom: () => Promise<void>;
};

const GalleryCtx = createContext<Ctx | null>(null);

// Extra wall slots for user-added artworks (cycled in order).
const EXTRA_SLOTS: { position: [number, number, number]; wall: Artwork["wall"] }[] = [
  { position: [-3, 1.6, -7.9], wall: "north" },
  { position: [3, 1.6, -7.9], wall: "north" },
  { position: [-7.9, 1.6, 0], wall: "west" },
  { position: [-7.9, 1.6, -6], wall: "west" },
  { position: [-7.9, 1.6, 6], wall: "west" },
  { position: [7.9, 1.6, 0], wall: "east" },
  { position: [7.9, 1.6, -6], wall: "east" },
  { position: [7.9, 1.6, 6], wall: "east" },
  { position: [-3, 1.6, 7.9], wall: "south" },
  { position: [3, 1.6, 7.9], wall: "south" },
];

function storedToArtwork(s: StoredArtwork, idx: number): Artwork {
  const slot = EXTRA_SLOTS[idx % EXTRA_SLOTS.length];
  const image = URL.createObjectURL(s.imageBlob);
  const mediaUrl = s.mediaBlob ? URL.createObjectURL(s.mediaBlob) : undefined;
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    year: s.year,
    category: s.category,
    description: s.description,
    room: s.room,
    image,
    audio: s.mediaType === "audio" ? mediaUrl : undefined,
    video: s.mediaType === "video" ? mediaUrl : undefined,
    position: slot.position,
    wall: slot.wall,
    tags: s.tags,
  };
}

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<Artwork[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [selected, setSelectedState] = useState<Artwork | null>(null);

  const reloadCustom = useCallback(async () => {
    try {
      const list = await idbList();
      list.sort((a, b) => a.createdAt - b.createdAt);
      setCustom((prev) => {
        // Revoke old blob URLs to avoid leaks.
        prev.forEach((a) => {
          if (a.image.startsWith("blob:")) URL.revokeObjectURL(a.image);
          if (a.audio?.startsWith("blob:")) URL.revokeObjectURL(a.audio);
          if (a.video?.startsWith("blob:")) URL.revokeObjectURL(a.video);
        });
        return list.map((s, i) => storedToArtwork(s, i));
      });
    } catch (e) {
      console.error("Failed to load custom artworks", e);
    }
  }, []);

  useEffect(() => {
    setFavorites(getFavorites());
    setRecent(getRecent());
    reloadCustom();
  }, [reloadCustom]);

  const artworks = useMemo(() => [...ARTWORKS, ...custom], [custom]);

  const setSelected = useCallback((a: Artwork | null) => {
    setSelectedState(a);
    if (a) {
      addRecentView(a.id);
      setRecent(getRecent());
      trackEvent({ type: "view-artwork", id: a.id });
      if (a.video) trackEvent({ type: "watch-video", id: a.id });
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    if (getFavorites().includes(id)) removeFavorite(id);
    else saveFavorite(id);
    const next = getFavorites();
    setFavorites(next);
    trackEvent({ type: "favorite", total: next.length });
  }, []);

  const isFav = useCallback((id: string) => favorites.includes(id), [favorites]);

  const persist = async (id: string, input: NewArtworkInput, createdAt?: number) => {
    const stored: StoredArtwork = {
      id,
      title: input.title,
      artist: input.artist,
      year: input.year,
      category: input.category,
      description: input.description,
      room: input.room,
      imageBlob: input.imageFile,
      mediaType: input.mediaType,
      mediaBlob: input.mediaFile,
      tags: input.tags,
      createdAt: createdAt ?? Date.now(),
    };
    await idbPut(stored);
    await reloadCustom();
  };

  const addArtwork = (input: NewArtworkInput) => persist(`custom-${Date.now()}`, input);
  const updateArtwork = (id: string, input: NewArtworkInput) => {
    const existing = custom.find((c) => c.id === id);
    return persist(id, input, existing ? undefined : Date.now());
  };
  const removeArtwork = async (id: string) => {
    await idbDelete(id);
    await reloadCustom();
  };

  const refreshCustom = () => reloadCustom();

  return (
    <GalleryCtx.Provider
      value={{
        artworks,
        customArtworks: custom,
        favorites,
        recent,
        selected,
        setSelected,
        toggleFavorite,
        isFav,
        addArtwork,
        updateArtwork,
        removeArtwork,
        refreshCustom,
      }}
    >
      {children}
    </GalleryCtx.Provider>
  );
}

export const useGallery = () => {
  const ctx = useContext(GalleryCtx);
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider");
  return ctx;
};

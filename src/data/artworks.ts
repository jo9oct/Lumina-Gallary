export type Artwork = {
  id: string;
  title: string;
  artist: string;
  year: number;
  category: string;
  description: string;
  image: string;
  audio?: string;
  video?: string;
  room: "modern" | "classical" | "digital" | "sculpture" | "experimental";
  position: [number, number, number];
  wall: "north" | "south" | "east" | "west";
  tags?: string[];
};

const img = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${q}?w=1200&auto=format&fit=crop&q=80&sig=${seed}`;

// Curated open art imagery
export const ARTWORKS: Artwork[] = [
  {
    id: "a1",
    title: "Chromatic Drift",
    artist: "Iris Vandermeer",
    year: 2023,
    category: "Modern",
    description:
      "An exploration of color as motion. Vandermeer layers translucent pigments to create surfaces that appear to breathe under changing light.",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80&auto=format&fit=crop",
    audio: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749e9b9.mp3",
    video: "https://www.youtube.com/embed/2WS9j7TwT9Q",
    room: "modern",
    position: [-6, 1.6, -7.9],
    wall: "north",
  },
  {
    id: "a2",
    title: "Velvet Silence",
    artist: "Kai Moreau",
    year: 2021,
    category: "Modern",
    description: "A minimalist meditation on negative space and atmospheric depth.",
    image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=1200&q=80&auto=format&fit=crop",
    audio: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc4a13d.mp3",
    room: "modern",
    position: [0, 1.6, -7.9],
    wall: "north",
  },
  {
    id: "a3",
    title: "Northern Reverie",
    artist: "Anya Lindqvist",
    year: 1894,
    category: "Classical",
    description: "Romantic landscape of the Scandinavian fjords at dawn.",
    image: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=1200&q=80&auto=format&fit=crop",
    audio: "https://cdn.pixabay.com/download/audio/2023/06/16/audio_1c2f8f8c43.mp3",
    room: "classical",
    position: [6, 1.6, -7.9],
    wall: "north",
  },
  {
    id: "a4",
    title: "The Cartographer",
    artist: "Tomás Aurelio",
    year: 1902,
    category: "Classical",
    description: "Oil portrait of a 19th century cartographer studying his last map.",
    image: "https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=1200&q=80&auto=format&fit=crop",
    room: "classical",
    position: [-7.9, 1.6, -3],
    wall: "west",
  },
  {
    id: "a5",
    title: "Signal/Noise",
    artist: "Studio 0xFADE",
    year: 2024,
    category: "Digital",
    description: "Generative composition computed live from urban radio interference.",
    image: "https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=1200&q=80&auto=format&fit=crop",
    video: "https://www.youtube.com/embed/V-_O7nl0Ii0",
    room: "digital",
    position: [7.9, 1.6, -3],
    wall: "east",
  },
  {
    id: "a6",
    title: "Liminal Render",
    artist: "Mei Tanaka",
    year: 2023,
    category: "Digital",
    description: "A neural-trained landscape oscillating between memory and machine.",
    image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1200&q=80&auto=format&fit=crop",
    room: "digital",
    position: [7.9, 1.6, 3],
    wall: "east",
  },
  {
    id: "a7",
    title: "Marble Tide",
    artist: "Elena Costa",
    year: 2019,
    category: "Sculpture",
    description: "Hand-carved Carrara marble that suggests fabric caught mid-fall.",
    image: "https://images.unsplash.com/photo-1565060169187-3735e2c39d2c?w=1200&q=80&auto=format&fit=crop",
    room: "sculpture",
    position: [-7.9, 1.6, 3],
    wall: "west",
  },
  {
    id: "a8",
    title: "Iron Bloom",
    artist: "Rafael Okafor",
    year: 2022,
    category: "Sculpture",
    description: "Forged steel petals welded into an eight-foot floral form.",
    image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1200&q=80&auto=format&fit=crop",
    room: "sculpture",
    position: [0, 1.6, 7.9],
    wall: "south",
  },
  {
    id: "a9",
    title: "Untitled (Glitch)",
    artist: "Phaedra Kim",
    year: 2024,
    category: "Experimental",
    description: "Mixed-media collage where torn paper meets projected light.",
    image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1200&q=80&auto=format&fit=crop",
    room: "experimental",
    position: [-6, 1.6, 7.9],
    wall: "south",
  },
  {
    id: "a10",
    title: "Resonance Field",
    artist: "Ola Brandt",
    year: 2023,
    category: "Experimental",
    description: "An immersive piece that maps room acoustics into shifting color fields.",
    image: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=1200&q=80&auto=format&fit=crop",
    room: "experimental",
    position: [6, 1.6, 7.9],
    wall: "south",
  },
];

export const ROOMS = [
  { id: "modern", name: "Modern Art", color: "#a855f7" },
  { id: "classical", name: "Classical", color: "#f59e0b" },
  { id: "digital", name: "Digital", color: "#22d3ee" },
  { id: "sculpture", name: "Sculpture Hall", color: "#e2e8f0" },
  { id: "experimental", name: "Experimental", color: "#ec4899" },
] as const;

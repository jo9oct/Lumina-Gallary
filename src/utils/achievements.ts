import toast from "react-hot-toast";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  condition: (s: AchievementState) => boolean;
};

export type AchievementState = {
  roomsVisited: string[];
  artworksViewed: string[];
  videosWatched: string[];
  favorites: number;
  toursCompleted: number;
  screenshots: number;
};

const KEY = "vag.achievements.v1";
const STATE_KEY = "vag.achievements.state.v1";

const DEFAULT_STATE: AchievementState = {
  roomsVisited: [],
  artworksViewed: [],
  videosWatched: [],
  favorites: 0,
  toursCompleted: 0,
  screenshots: 0,
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-step", title: "First Step", description: "Entered the gallery", condition: (s) => s.roomsVisited.length >= 1 },
  { id: "all-rooms", title: "Visited All Rooms", description: "Explored every room", condition: (s) => s.roomsVisited.length >= 5 },
  { id: "modern-explorer", title: "Modern Art Explorer", description: "Viewed 3 modern works", condition: (s) => s.artworksViewed.length >= 3 },
  { id: "curator", title: "Curator", description: "Favorited 3 artworks", condition: (s) => s.favorites >= 3 },
  { id: "cinephile", title: "Cinephile", description: "Watched a video tour", condition: (s) => s.videosWatched.length >= 1 },
  { id: "tour-guide", title: "Tour Guide", description: "Completed a guided tour", condition: (s) => s.toursCompleted >= 1 },
  { id: "photographer", title: "Photographer", description: "Captured a screenshot", condition: (s) => s.screenshots >= 1 },
];

const safe = <T,>(fn: () => T, f: T): T => {
  if (typeof window === "undefined") return f;
  try {
    return fn();
  } catch {
    return f;
  }
};

export function getState(): AchievementState {
  return safe(() => ({ ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STATE_KEY) || "{}") }), DEFAULT_STATE);
}
export function getUnlocked(): string[] {
  return safe(() => JSON.parse(localStorage.getItem(KEY) || "[]"), []);
}
function saveState(s: AchievementState) {
  if (typeof window !== "undefined") localStorage.setItem(STATE_KEY, JSON.stringify(s));
}
function saveUnlocked(list: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

function checkUnlocks(state: AchievementState) {
  const unlocked = new Set(getUnlocked());
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.has(a.id) && a.condition(state)) {
      unlocked.add(a.id);
      toast.success(`🏆 ${a.title} — ${a.description}`, { duration: 4000 });
    }
  }
  saveUnlocked([...unlocked]);
}

export function trackEvent(
  ev:
    | { type: "view-room"; room: string }
    | { type: "view-artwork"; id: string }
    | { type: "watch-video"; id: string }
    | { type: "favorite"; total: number }
    | { type: "tour-complete" }
    | { type: "screenshot" },
) {
  const s = getState();
  if (ev.type === "view-room" && !s.roomsVisited.includes(ev.room)) s.roomsVisited.push(ev.room);
  if (ev.type === "view-artwork" && !s.artworksViewed.includes(ev.id)) s.artworksViewed.push(ev.id);
  if (ev.type === "watch-video" && !s.videosWatched.includes(ev.id)) s.videosWatched.push(ev.id);
  if (ev.type === "favorite") s.favorites = ev.total;
  if (ev.type === "tour-complete") s.toursCompleted += 1;
  if (ev.type === "screenshot") s.screenshots += 1;
  saveState(s);
  checkUnlocks(s);
}

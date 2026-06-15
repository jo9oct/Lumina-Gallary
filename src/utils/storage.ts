const FAV_KEY = "vag.favorites";
const RECENT_KEY = "vag.recent";
const CUSTOM_KEY = "vag.customArtworks";

const safe = <T,>(fn: () => T, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { return fn(); } catch { return fallback; }
};

export const getFavorites = (): string[] =>
  safe(() => JSON.parse(localStorage.getItem(FAV_KEY) || "[]"), []);

export const saveFavorite = (id: string) => {
  const list = getFavorites();
  if (!list.includes(id)) localStorage.setItem(FAV_KEY, JSON.stringify([...list, id]));
};

export const removeFavorite = (id: string) => {
  localStorage.setItem(FAV_KEY, JSON.stringify(getFavorites().filter((x) => x !== id)));
};

export const isFavorite = (id: string) => getFavorites().includes(id);

export const getRecent = (): string[] =>
  safe(() => JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"), []);

export const addRecentView = (id: string) => {
  const list = [id, ...getRecent().filter((x) => x !== id)].slice(0, 20);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
};

export const getCustomArtworks = () =>
  safe(() => JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"), [] as any[]);

export const saveCustomArtworks = (list: any[]) =>
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));

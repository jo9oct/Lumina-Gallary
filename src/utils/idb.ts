// Tiny IndexedDB wrapper for storing custom artworks with media blobs.
const DB_NAME = "virtua-gallery";
const STORE = "artworks";
const VERSION = 1;

export type StoredArtwork = {
  id: string;
  title: string;
  artist: string;
  year: number;
  category: string;
  description: string;
  room: "modern" | "classical" | "digital" | "sculpture" | "experimental";
  imageBlob: Blob;
  mediaType: "audio" | "video" | null;
  mediaBlob: Blob | null;
  tags?: string[];
  createdAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    const r = fn(s);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const idbList = (): Promise<StoredArtwork[]> =>
  tx<StoredArtwork[]>("readonly", (s) => s.getAll() as IDBRequest<StoredArtwork[]>);

export const idbPut = (a: StoredArtwork) =>
  tx<IDBValidKey>("readwrite", (s) => s.put(a));

export const idbDelete = (id: string) =>
  tx<undefined>("readwrite", (s) => s.delete(id) as IDBRequest<undefined>);

export const fileToBlob = async (f: File): Promise<Blob> => new Blob([await f.arrayBuffer()], { type: f.type });

// ---- Export / Import (JSON backup) ----

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

const base64ToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return res.blob();
};

export type ExportedArtwork = Omit<StoredArtwork, "imageBlob" | "mediaBlob"> & {
  imageData: string;
  mediaData: string | null;
};

export async function exportAll(): Promise<{ version: number; exportedAt: number; items: ExportedArtwork[] }> {
  const items = await idbList();
  const out: ExportedArtwork[] = [];
  for (const it of items) {
    const { imageBlob, mediaBlob, ...rest } = it;
    out.push({
      ...rest,
      imageData: await blobToBase64(imageBlob),
      mediaData: mediaBlob ? await blobToBase64(mediaBlob) : null,
    });
  }
  return { version: 1, exportedAt: Date.now(), items: out };
}

export async function importAll(json: { items: ExportedArtwork[] }, mode: "merge" | "replace" = "merge"): Promise<number> {
  if (mode === "replace") {
    const existing = await idbList();
    for (const e of existing) await idbDelete(e.id);
  }
  let count = 0;
  for (const it of json.items || []) {
    const imageBlob = await base64ToBlob(it.imageData);
    const mediaBlob = it.mediaData ? await base64ToBlob(it.mediaData) : null;
    await idbPut({
      id: it.id,
      title: it.title,
      artist: it.artist,
      year: it.year,
      category: it.category,
      description: it.description,
      room: it.room,
      imageBlob,
      mediaType: it.mediaType,
      mediaBlob,
      tags: it.tags,
      createdAt: it.createdAt ?? Date.now(),
    });
    count++;
  }
  return count;
}

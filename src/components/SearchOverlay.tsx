import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Tag as TagIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGallery } from "@/context/GalleryContext";

type Filter = "all" | "image" | "audio" | "video";

export function SearchOverlay() {
  const { artworks, setSelected } = useGallery();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    artworks.forEach((a) => a.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [artworks]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return artworks
      .filter((a) => {
        if (filter === "audio" && !a.audio) return false;
        if (filter === "video" && !a.video) return false;
        if (filter === "image" && (a.audio || a.video)) return false;
        if (tag && !(a.tags ?? []).includes(tag)) return false;
        if (s && ![a.title, a.artist, a.category, String(a.year), a.room, ...(a.tags ?? [])].join(" ").toLowerCase().includes(s)) return false;
        return true;
      })
      .slice(0, 24);
  }, [q, artworks, filter, tag]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2.5 text-xs neon-border hover:bg-white/10 transition"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-xl grid place-items-start pt-24 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl glass-strong neon-border overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border p-4">
                <Search className="h-4 w-4 text-neon-cyan" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by artist, title, year, tag…"
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
                {(["all", "image", "audio", "video"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wider transition ${
                      filter === f ? "bg-neon-purple text-white" : "glass hover:bg-white/10"
                    }`}
                  >
                    {f}
                  </button>
                ))}
                {allTags.length > 0 && (
                  <>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <TagIcon className="h-3 w-3 text-muted-foreground" />
                    {allTags.slice(0, 12).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTag(t === tag ? null : t)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] ${tag === t ? "bg-neon-cyan text-background" : "glass hover:bg-white/10"}`}
                      >
                        #{t}
                      </button>
                    ))}
                  </>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {results.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No matches.</div>
                )}
                {results.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelected(a);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5 transition"
                  >
                    <img src={a.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{a.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.artist} · {a.year} · {a.category}
                        {a.audio && " · ♪"}
                        {a.video && " · ▶"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

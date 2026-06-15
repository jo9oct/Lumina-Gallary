import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import {
  Plus, Trash2, Edit3, Image as ImageIcon, Sparkles, Music, Video as VideoIcon,
  X, Upload, Download, Tag as TagIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useGallery, type NewArtworkInput } from "@/context/GalleryContext";
import type { Artwork } from "@/data/artworks";
import { ROOMS } from "@/data/artworks";
import { exportAll, importAll } from "@/utils/idb";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Curator · Virtua Gallery" },
      { name: "description", content: "Manage your private collection — uploads are saved locally in your browser (IndexedDB)." },
    ],
  }),
  component: AdminPage,
});

type FormState = {
  title: string;
  artist: string;
  year: number;
  category: string;
  description: string;
  room: Artwork["room"];
  imageFile: File | null;
  imagePreview: string;
  mediaType: "audio" | "video" | null;
  mediaFile: File | null;
  mediaPreview: string;
  tagsText: string;
};

const emptyForm: FormState = {
  title: "",
  artist: "",
  year: new Date().getFullYear(),
  category: "Modern",
  description: "",
  room: "modern",
  imageFile: null,
  imagePreview: "",
  mediaType: null,
  mediaFile: null,
  mediaPreview: "",
  tagsText: "",
};

const parseTags = (s: string): string[] =>
  s.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

function AdminPage() {
  const { customArtworks, addArtwork, updateArtwork, removeArtwork, favorites, recent, refreshCustom } = useGallery();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "image" | "audio" | "video">("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    customArtworks.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [customArtworks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customArtworks.filter((a) => {
      if (filterType === "audio" && !a.audio) return false;
      if (filterType === "video" && !a.video) return false;
      if (filterType === "image" && (a.audio || a.video)) return false;
      if (filterTag && !(a.tags || []).includes(filterTag)) return false;
      if (q && ![a.title, a.artist, a.category, a.room, ...(a.tags ?? [])].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [customArtworks, search, filterType, filterTag]);

  const stats = useMemo(
    () => [
      { label: "Your uploads", value: customArtworks.length, color: "from-neon-purple to-neon-blue" },
      { label: "With audio", value: customArtworks.filter((a) => a.audio).length, color: "from-neon-blue to-neon-cyan" },
      { label: "With video", value: customArtworks.filter((a) => a.video).length, color: "from-pink-500 to-neon-purple" },
      { label: "Favorites · Recent", value: `${favorites.length} · ${recent.length}`, color: "from-neon-cyan to-emerald-400" },
    ],
    [customArtworks, favorites, recent],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    if (imageRef.current) imageRef.current.value = "";
    if (mediaRef.current) mediaRef.current.value = "";
  };

  const acceptFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      setForm((f) => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
      toast.success("Image attached");
    } else if (file.type.startsWith("audio/")) {
      setForm((f) => ({ ...f, mediaType: "audio", mediaFile: file, mediaPreview: URL.createObjectURL(file) }));
      toast.success("Audio attached");
    } else if (file.type.startsWith("video/")) {
      setForm((f) => ({ ...f, mediaType: "video", mediaFile: file, mediaPreview: URL.createObjectURL(file) }));
      toast.success("Video attached");
    } else {
      toast.error("Unsupported file type");
    }
  };

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    setForm((f) => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const onMedia = (e: React.ChangeEvent<HTMLInputElement>, kind: "audio" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith(`${kind}/`)) { toast.error(`Please choose an ${kind} file`); return; }
    setForm((f) => ({ ...f, mediaType: kind, mediaFile: file, mediaPreview: URL.createObjectURL(file) }));
  };

  const clearMedia = () => {
    setForm((f) => ({ ...f, mediaType: null, mediaFile: null, mediaPreview: "" }));
    if (mediaRef.current) mediaRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(acceptFile);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) { toast.error("Title and artist are required"); return; }
    if (!editId && !form.imageFile) { toast.error("Please upload an image"); return; }
    setBusy(true);
    try {
      const input: NewArtworkInput = {
        title: form.title,
        artist: form.artist,
        year: form.year,
        category: form.category,
        description: form.description,
        room: form.room,
        imageFile: form.imageFile!,
        mediaType: form.mediaType,
        mediaFile: form.mediaFile,
        tags: parseTags(form.tagsText),
      };
      if (editId && !form.imageFile) {
        toast.error("Please re-upload an image to update");
        setBusy(false);
        return;
      }
      if (editId) {
        await updateArtwork(editId, input);
        toast.success("Artwork updated");
      } else {
        await addArtwork(input);
        toast.success("Artwork added to gallery");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (a: Artwork) => {
    setEditId(a.id);
    setForm({
      ...emptyForm,
      title: a.title,
      artist: a.artist,
      year: a.year,
      category: a.category,
      description: a.description,
      room: a.room,
      imagePreview: a.image,
      mediaType: a.video ? "video" : a.audio ? "audio" : null,
      mediaPreview: a.video || a.audio || "",
      tagsText: (a.tags ?? []).join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this artwork? This cannot be undone.")) return;
    await removeArtwork(id);
    toast.success("Artwork removed");
    if (editId === id) resetForm();
  };

  const doExport = async () => {
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `virtua-gallery-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.items.length} items`);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };

  const doImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const mode: "merge" | "replace" = confirm("Replace existing uploads? OK = replace, Cancel = merge") ? "replace" : "merge";
      const n = await importAll(json, mode);
      await refreshCustom();
      toast.success(`Imported ${n} items`);
    } catch (err) {
      console.error(err);
      toast.error("Invalid backup file");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-neon-cyan" /> Saved locally in your browser · IndexedDB
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold">Curator Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={doExport} className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Export backup
          </button>
          <button onClick={() => importRef.current?.click()} className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs hover:bg-white/10">
            <Upload className="h-3.5 w-3.5" /> Import backup
          </button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={doImport} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={`mt-2 font-display text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <form
          onSubmit={submit}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`glass-strong rounded-2xl p-6 space-y-4 transition ${dragOver ? "ring-2 ring-neon-purple" : ""}`}
        >
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-neon-purple" /> {editId ? "Edit artwork" : "Add artwork"}
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">Tip: drag &amp; drop any image, audio, or video into this panel.</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
            <Field label="Artist" value={form.artist} onChange={(v) => setForm((f) => ({ ...f, artist: v }))} required />
            <Field label="Year" type="number" value={String(form.year)} onChange={(v) => setForm((f) => ({ ...f, year: Number(v) || 0 }))} />
            <Field label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Room</span>
            <select
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value as Artwork["room"] }))}
              className="mt-1 w-full rounded-lg glass px-3 py-2 text-sm"
            >
              {ROOMS.map((r) => <option key={r.id} value={r.id} className="bg-background">{r.name}</option>)}
            </select>
          </label>

          <Field
            label="Tags (comma separated)"
            value={form.tagsText}
            onChange={(v) => setForm((f) => ({ ...f, tagsText: v }))}
            placeholder="travel, family, abstract"
          />

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg glass px-3 py-2 text-sm"
            />
          </label>

          {/* Image — required */}
          <div className="rounded-xl glass p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5" /> Image <span className="text-rose-400">*</span>
              </span>
              {form.imagePreview && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageFile: null, imagePreview: "" }))} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
              )}
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              onChange={onImage}
              className="mt-2 w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-foreground"
            />
            {form.imagePreview && (
              <img src={form.imagePreview} className="mt-3 max-h-40 rounded-lg object-contain ring-1 ring-border" />
            )}
          </div>

          {/* Audio OR Video — optional, mutually exclusive */}
          <div className="rounded-xl glass p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Audio or Video <span className="text-muted-foreground/60">(optional)</span></span>
              {form.mediaType && (
                <button type="button" onClick={clearMedia} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {!form.mediaType && (
              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer rounded-lg glass hover:bg-white/10 p-3 flex flex-col items-center gap-1.5 text-xs">
                  <Music className="h-4 w-4 text-neon-cyan" />
                  Add audio
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => onMedia(e, "audio")} />
                </label>
                <label className="cursor-pointer rounded-lg glass hover:bg-white/10 p-3 flex flex-col items-center gap-1.5 text-xs">
                  <VideoIcon className="h-4 w-4 text-neon-purple" />
                  Add video
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => onMedia(e, "video")} />
                </label>
              </div>
            )}

            {form.mediaType === "audio" && form.mediaPreview && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neon-cyan mb-1">Audio preview</p>
                <audio controls src={form.mediaPreview} className="w-full" />
              </div>
            )}
            {form.mediaType === "video" && form.mediaPreview && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neon-purple mb-1">Video preview</p>
                <video controls src={form.mediaPreview} className="w-full max-h-48 rounded-lg" />
              </div>
            )}
            <input ref={mediaRef} type="file" className="hidden" />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-neon-purple/30 disabled:opacity-50"
            >
              {busy ? "Saving..." : editId ? "Update artwork" : "Add to gallery"}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="rounded-full glass px-4 py-2.5 text-sm hover:bg-white/10">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold">Your uploads ({filtered.length}/{customArtworks.length})</h2>
          </div>

          {/* Filter bar */}
          <div className="space-y-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, artist, tags…"
              className="w-full rounded-lg glass px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {(["all", "image", "audio", "video"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wider transition ${
                    filterType === t ? "bg-neon-purple text-white" : "glass hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <TagIcon className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => setFilterTag(null)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] ${!filterTag ? "bg-white/15" : "glass hover:bg-white/10"}`}
                >
                  all
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTag(t === filterTag ? null : t)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] ${filterTag === t ? "bg-neon-cyan text-background" : "glass hover:bg-white/10"}`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {customArtworks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No uploads yet. Add your first artwork on the left — it will appear instantly in the 3D gallery.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No items match the filters.
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl glass p-2.5">
                  <img src={a.image} className="h-14 w-14 rounded-lg object-cover ring-1 ring-border" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.artist} · {a.room}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider">
                      {a.audio && <span className="text-neon-cyan">♪ audio</span>}
                      {a.video && <span className="text-neon-purple">▶ video</span>}
                      {(a.tags ?? []).map((t) => (
                        <span key={t} className="text-muted-foreground">#{t}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => startEdit(a)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Edit">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(a.id)} className="rounded-lg p-2 hover:bg-destructive/20 text-destructive" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg glass px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-purple"
      />
    </label>
  );
}

import { Howl } from "howler";

let ctx: AudioContext | null = null;
let lastStep = 0;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Synthesized soft footstep (works without external assets). */
export function playFootstep(intensity = 0.5) {
  const now = performance.now();
  if (now - lastStep < 320) return;
  lastStep = now;
  const c = getCtx();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.15), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / c.sampleRate;
    // brown-ish noise burst with quick decay
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 28) * intensity;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const g = c.createGain();
  g.gain.value = 0.35;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

const ROOM_TRACKS: Record<string, string> = {
  modern: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749e9b9.mp3",
  classical: "https://cdn.pixabay.com/download/audio/2023/06/16/audio_1c2f8f8c43.mp3",
  digital: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc4a13d.mp3",
  sculpture: "https://cdn.pixabay.com/download/audio/2023/06/16/audio_1c2f8f8c43.mp3",
  experimental: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749e9b9.mp3",
};

let music: Howl | null = null;
let currentTrack = "";

export function setRoomMusic(room: string, enabled: boolean) {
  if (!enabled) {
    if (music) {
      music.fade(music.volume(), 0, 600);
      const m = music;
      setTimeout(() => m.stop(), 650);
    }
    music = null;
    currentTrack = "";
    return;
  }
  if (currentTrack === room) return;
  const src = ROOM_TRACKS[room];
  if (!src) return;
  const next = new Howl({ src: [src], html5: true, loop: true, volume: 0 });
  try {
    next.play();
    next.fade(0, 0.18, 1500);
  } catch {
    /* ignore */
  }
  if (music) {
    const prev = music;
    prev.fade(prev.volume(), 0, 1500);
    setTimeout(() => prev.stop(), 1600);
  }
  music = next;
  currentTrack = room;
}

let intro: Howl | null = null;
export function playIntroMusic() {
  if (intro) return;
  intro = new Howl({
    src: ["https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc4a13d.mp3"],
    html5: true,
    volume: 0,
    loop: true,
  });
  try {
    intro.play();
    intro.fade(0, 0.3, 2000);
  } catch {
    /* ignore */
  }
}
export function stopIntroMusic() {
  if (!intro) return;
  const i = intro;
  i.fade(i.volume(), 0, 800);
  setTimeout(() => i.stop(), 850);
  intro = null;
}

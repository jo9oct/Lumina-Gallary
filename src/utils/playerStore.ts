type Listener = () => void;

class PlayerStore {
  x = 0;
  z = 0;
  ry = 0;
  room: string = "modern";
  private listeners = new Set<Listener>();
  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  set(x: number, z: number, ry: number, room: string) {
    this.x = x;
    this.z = z;
    this.ry = ry;
    const changed = room !== this.room;
    this.room = room;
    this.listeners.forEach((l) => l());
    if (changed && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vag:room-change", { detail: room }));
    }
  }
}

export const playerStore = new PlayerStore();

import { useEffect, useState } from "react";
import { playerStore } from "@/utils/playerStore";
import { ARTWORKS, ROOMS } from "@/data/artworks";

const ROOM_SIZE = 20;
const SIZE = 170;

export function Minimap() {
  const [, force] = useState(0);
  useEffect(() => {
    const unsub = playerStore.subscribe(() => force((n) => n + 1));
    return () => { unsub(); };
  }, []);

  const px = ((playerStore.x + ROOM_SIZE / 2) / ROOM_SIZE) * SIZE;
  const pz = ((playerStore.z + ROOM_SIZE / 2) / ROOM_SIZE) * SIZE;
  const rotDeg = (playerStore.ry * 180) / Math.PI;
  const current = ROOMS.find((r) => r.id === playerStore.room);

  return (
    <div className="absolute top-4 right-4 z-20 select-none pointer-events-none">
      <div className="glass-strong rounded-2xl p-3 neon-border w-fit">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-neon-cyan">MAP</span>
          <span className="text-[10px] uppercase tracking-wider text-foreground/90" style={{ color: current?.color }}>
            {current?.name || "Hall"}
          </span>
        </div>
        <div className="relative rounded-lg overflow-hidden ring-1 ring-neon-purple/40 bg-black/70" style={{ width: SIZE, height: SIZE }}>
          {/* grid */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(168,85,247,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.4) 1px, transparent 1px)",
              backgroundSize: `${SIZE / 8}px ${SIZE / 8}px`,
            }}
          />
          {/* artwork dots */}
          {ARTWORKS.map((a) => {
            const ax = ((a.position[0] + ROOM_SIZE / 2) / ROOM_SIZE) * SIZE;
            const az = ((a.position[2] + ROOM_SIZE / 2) / ROOM_SIZE) * SIZE;
            const color = ROOMS.find((r) => r.id === a.room)?.color || "#fff";
            return (
              <div
                key={a.id}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  left: ax - 3,
                  top: az - 3,
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
            );
          })}
          {/* player */}
          <div className="absolute" style={{ left: px - 8, top: pz - 8, transition: "left 90ms linear, top 90ms linear" }}>
            <div
              className="h-4 w-4 grid place-items-center"
              style={{ transform: `rotate(${rotDeg}deg)` }}
            >
              <div
                className="h-0 w-0"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderBottom: "9px solid var(--neon-cyan)",
                  filter: "drop-shadow(0 0 6px rgba(34,211,238,0.9))",
                }}
              />
            </div>
            <div className="absolute inset-0 -m-1 rounded-full animate-ping bg-neon-cyan/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

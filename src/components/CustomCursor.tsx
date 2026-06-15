import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setEnabled(true);
    let x = 0, y = 0, rx = 0, ry = 0;
    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
    };
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8 rounded-full border border-neon-cyan/70 mix-blend-difference" style={{ boxShadow: "0 0 16px rgba(34,211,238,0.4)" }} />
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-neon-cyan" style={{ boxShadow: "0 0 8px rgba(34,211,238,0.9)" }} />
    </>
  );
}

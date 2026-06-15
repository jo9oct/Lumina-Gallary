import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Html, MeshReflectorMaterial } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ARTWORKS, ROOMS, type Artwork } from "@/data/artworks";
import { useGallery } from "@/context/GalleryContext";
import { Minimap } from "@/components/Minimap";
import { CinematicIntro } from "@/components/CinematicIntro";
import { CinematicEffects } from "./Effects";
import { DustParticles } from "./Particles";
import { playerStore } from "@/utils/playerStore";
import { playFootstep, setRoomMusic } from "@/utils/audio";
import { trackEvent } from "@/utils/achievements";
import { Camera, Maximize, Moon, Play, Sun, Square, X } from "lucide-react";
import toast from "react-hot-toast";

const ROOM_SIZE = 20;
const WALL_H = 6;

/* ---------- helpers ---------- */
function makeFallbackTexture(label: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 640;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 640);
  grad.addColorStop(0, "#2a1f4a"); grad.addColorStop(1, "#0c0a14");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 4; ctx.strokeRect(16, 16, 480, 608);
  ctx.fillStyle = "#e5e7eb"; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(label.slice(0, 22), 256, 320);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function useArtworkTexture(url: string, label: string): THREE.Texture {
  const { gl } = useThree();
  const [tex, setTex] = useState<THREE.Texture>(() => makeFallbackTexture(label));
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const t = new THREE.Texture(img);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.needsUpdate = true;
      setTex(t);
    };
    img.onerror = () => {};
    img.src = url;
    return () => { cancelled = true; };
  }, [url, label, gl]);
  return tex;
}

/* ---------- focus target store (camera fly-to) ---------- */
type FocusTarget = { pos: THREE.Vector3; look: THREE.Vector3; artworkId: string } | null;

function nearestRoom(x: number, z: number) {
  let best = ARTWORKS[0]; let bestD = Infinity;
  for (const a of ARTWORKS) {
    const dx = a.position[0] - x, dz = a.position[2] - z;
    const d = dx * dx + dz * dz;
    if (d < bestD) { bestD = d; best = a; }
  }
  return best.room;
}

/* ---------- environment ---------- */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={28}
        roughness={0.85}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0d0a18"
        metalness={0.55}
        mirror={0.45}
      />
    </mesh>
  );
}

function Ceiling({ night }: { night: boolean }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_H, 0]}>
      <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
      <meshStandardMaterial color={night ? "#15122a" : "#2a2640"} roughness={0.9} />
    </mesh>
  );
}

function Wall({ position, rotation, night }: { position: [number, number, number]; rotation: [number, number, number]; night: boolean }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow>
        <planeGeometry args={[ROOM_SIZE, WALL_H]} />
        <meshStandardMaterial color={night ? "#2d2845" : "#6b6480"} roughness={0.78} metalness={0.08} />
      </mesh>
      {/* baseboard */}
      <mesh position={[0, -WALL_H / 2 + 0.15, 0.02]}>
        <planeGeometry args={[ROOM_SIZE, 0.3]} />
        <meshStandardMaterial color="#0c0a14" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* cornice / accent strip */}
      <mesh position={[0, WALL_H / 2 - 0.2, 0.02]}>
        <planeGeometry args={[ROOM_SIZE, 0.04]} />
        <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={night ? 1.2 : 0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- artwork frame ---------- */
function ArtworkFrame({
  artwork,
  onFocus,
  onOpen,
}: {
  artwork: Artwork;
  onFocus: (a: Artwork) => void;
  onOpen: (a: Artwork) => void;
}) {
  const tex = useArtworkTexture(artwork.image, artwork.title);
  const [hovered, setHovered] = useState(false);
  const frameRef = useRef<THREE.Mesh>(null);
  const clickTimer = useRef<number | null>(null);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);

  useFrame((state) => {
    if (!frameRef.current) return;
    const mat = frameRef.current.material as THREE.MeshStandardMaterial;
    const pulse = hovered ? 0.7 + Math.sin(state.clock.elapsedTime * 4) * 0.3 : 0.25;
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, pulse, 0.15);
  });

  const rotY = { north: 0, south: Math.PI, east: -Math.PI / 2, west: Math.PI / 2 }[artwork.wall];
  const w = 2.8, h = 3.5;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onOpen(artwork);
    } else {
      clickTimer.current = window.setTimeout(() => {
        clickTimer.current = null;
        onFocus(artwork);
      }, 240);
    }
  };

  return (
    <group
      position={artwork.position}
      rotation={[0, rotY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* large invisible hitbox for easier clicking */}
      <mesh position={[0, 0, 0.15]} visible={false}>
        <planeGeometry args={[w + 1.2, h + 1.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* outer gold frame */}
      <mesh ref={frameRef} position={[0, 0, -0.08]} castShadow scale={hovered ? 1.04 : 1}>
        <boxGeometry args={[w + 0.4, h + 0.4, 0.16]} />
        <meshStandardMaterial
          color={hovered ? "#ffe8a8" : "#c9a84c"}
          emissive={hovered ? "#fcd34d" : "#3a2d0a"}
          emissiveIntensity={0.25}
          metalness={0.95}
          roughness={0.22}
          toneMapped={false}
        />
      </mesh>
      {/* inner mat */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[w + 0.15, h + 0.15]} />
        <meshStandardMaterial color="#0c0a14" roughness={0.6} />
      </mesh>
      {/* artwork */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* hover neon outline */}
      {hovered && (
        <mesh position={[0, 0, -0.09]}>
          <planeGeometry args={[w + 0.7, h + 0.7]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.35} toneMapped={false} />
        </mesh>
      )}
      <spotLight
        position={[0, 2.8, 1.8]}
        angle={0.6}
        penumbra={0.5}
        intensity={hovered ? 70 : 32}
        color={hovered ? "#fff5e0" : "#fff2d6"}
        distance={10}
        castShadow
        target-position={[0, 0, 0]}
      />
      {hovered && (
        <Html center position={[0, -h / 2 - 0.45, 0.05]} distanceFactor={7} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-lg bg-black/85 px-3 py-1.5 text-xs text-white backdrop-blur-md ring-1 ring-neon-purple/60">
            <strong>{artwork.title}</strong>
            <span className="text-neon-cyan"> · click to focus · double-click to open</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---------- sculptures ---------- */
function Sculpture({ position, kind = "torus" }: { position: [number, number, number]; kind?: "torus" | "ico" }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.3;
    ref.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.8, 32]} />
        <meshStandardMaterial color="#0c0a14" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={ref} position={[0, 1.6, 0]} castShadow>
        {kind === "torus" ? (
          <torusKnotGeometry args={[0.5, 0.18, 128, 16]} />
        ) : (
          <icosahedronGeometry args={[0.65, 0]} />
        )}
        <meshStandardMaterial color="#a855f7" emissive="#6d28d9" emissiveIntensity={0.9} metalness={0.85} roughness={0.18} />
      </mesh>
      <pointLight position={[0, 2.2, 0]} intensity={6} color="#a855f7" distance={5} />
    </group>
  );
}

/* ---------- tour ---------- */
const TOUR_WAYPOINTS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [0, 1.7, 5], look: [0, 1.6, -7.9] },
  { pos: [-4, 1.7, -4], look: [-6, 1.6, -7.9] },
  { pos: [4, 1.7, -4], look: [6, 1.6, -7.9] },
  { pos: [-5, 1.7, 0], look: [-7.9, 1.6, -3] },
  { pos: [5, 1.7, 0], look: [7.9, 1.6, 3] },
  { pos: [0, 1.7, 4], look: [0, 1.6, 7.9] },
  { pos: [0, 1.7, 0], look: [0, 1.6, -1] },
];

function PlayerControls({
  tour,
  focus,
  onFocusArrive,
  onTourEnd,
}: {
  tour: boolean;
  focus: FocusTarget;
  onFocusArrive: () => void;
  onTourEnd: () => void;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const tourIdx = useRef(0);
  const tourT = useRef(0);
  const lastStepTime = useRef(0);
  const focusT = useRef(0);
  const focusStart = useRef(new THREE.Vector3());
  const focusActive = useRef<string | null>(null);

  useEffect(() => {
    camera.position.set(0, 1.7, 6);
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera]);

  useEffect(() => {
    if (tour) { tourIdx.current = 0; tourT.current = 0; }
  }, [tour]);

  useEffect(() => {
    if (focus && focus.artworkId !== focusActive.current) {
      focusActive.current = focus.artworkId;
      focusT.current = 0;
      focusStart.current.copy(camera.position);
    }
    if (!focus) focusActive.current = null;
  }, [focus, camera]);

  useFrame((state, dt) => {
    if (focus) {
      focusT.current = Math.min(1, focusT.current + dt / 1.2);
      const t = focusT.current;
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(focusStart.current, focus.pos, eased);
      camera.lookAt(focus.look);
      if (t >= 1) onFocusArrive();
    } else if (tour) {
      const a = TOUR_WAYPOINTS[tourIdx.current];
      const b = TOUR_WAYPOINTS[(tourIdx.current + 1) % TOUR_WAYPOINTS.length];
      tourT.current += dt / 4;
      const t = Math.min(1, tourT.current);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(new THREE.Vector3(...a.pos), new THREE.Vector3(...b.pos), eased);
      const target = new THREE.Vector3().lerpVectors(new THREE.Vector3(...a.look), new THREE.Vector3(...b.look), eased);
      camera.lookAt(target);
      if (t >= 1) {
        tourIdx.current += 1;
        tourT.current = 0;
        if (tourIdx.current >= TOUR_WAYPOINTS.length - 1) {
          trackEvent({ type: "tour-complete" });
          onTourEnd();
        }
      }
    } else {
      const speed = 4 * dt;
      const dir = new THREE.Vector3();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      if (keys.current["KeyW"] || keys.current["ArrowUp"]) dir.add(forward);
      if (keys.current["KeyS"] || keys.current["ArrowDown"]) dir.sub(forward);
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) dir.add(right);
      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) dir.sub(right);
      const moving = dir.lengthSq() > 0;
      if (moving) {
        dir.normalize().multiplyScalar(speed);
        velocity.current.lerp(dir, 0.4);
      } else {
        velocity.current.lerp(new THREE.Vector3(), 0.2);
      }
      camera.position.add(velocity.current);
      const limit = ROOM_SIZE / 2 - 0.6;
      camera.position.x = Math.max(-limit, Math.min(limit, camera.position.x));
      camera.position.z = Math.max(-limit, Math.min(limit, camera.position.z));
      camera.position.y = 1.7;

      if (moving && velocity.current.length() > 0.01) {
        const now = state.clock.elapsedTime;
        if (now - lastStepTime.current > 0.42) {
          playFootstep(0.4);
          lastStepTime.current = now;
        }
      }
    }

    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    const room = nearestRoom(camera.position.x, camera.position.z);
    playerStore.set(camera.position.x, camera.position.z, e.y, room);
  });
  return null;
}

/* ---------- room music + achievements bridge ---------- */
function RoomMusicWatcher({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) { setRoomMusic("", false); return; }
    const handler = (e: Event) => {
      const room = (e as CustomEvent<string>).detail;
      setRoomMusic(room, true);
      trackEvent({ type: "view-room", room });
    };
    setRoomMusic(playerStore.room, true);
    trackEvent({ type: "view-room", room: playerStore.room });
    window.addEventListener("vag:room-change", handler);
    return () => window.removeEventListener("vag:room-change", handler);
  }, [enabled]);
  return null;
}

/* ---------- main scene ---------- */
export function GalleryScene() {
  const { setSelected, artworks } = useGallery();
  // Show all artworks that have a position (defaults + user uploads from IndexedDB).
  const placed = useMemo(() => artworks.filter((a) => a.position && a.wall), [artworks]);
  const [locked, setLocked] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [night, setNight] = useState(true);
  const [tour, setTour] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [focus, setFocus] = useState<FocusTarget>(null);
  const [focusedArt, setFocusedArt] = useState<Artwork | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFocus = useCallback((a: Artwork) => {
    const rotY = { north: 0, south: Math.PI, east: -Math.PI / 2, west: Math.PI / 2 }[a.wall];
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, rotY, 0));
    const pos = new THREE.Vector3(...a.position).add(normal.multiplyScalar(3.6));
    pos.y = 1.7;
    const look = new THREE.Vector3(a.position[0], a.position[1], a.position[2]);
    setFocus({ pos, look, artworkId: a.id });
    setFocusedArt(a);
    trackEvent({ type: "view-artwork", id: a.id });
  }, []);

  const exitFocus = useCallback(() => {
    setFocus(null);
    setFocusedArt(null);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") exitFocus(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, exitFocus]);

  const requestLock = () => {
    const c = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    canvasRef.current = c;
    c?.requestPointerLock();
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await containerRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  const takeScreenshot = () => {
    const c = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!c) return;
    try {
      const url = c.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `virtua-gallery-${Date.now()}.png`;
      a.click();
      trackEvent({ type: "screenshot" });
      toast.success("Screenshot saved");
    } catch {
      toast.error("Could not capture screenshot");
    }
  };

  return (
    <div ref={containerRef} className="relative h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl ring-1 ring-border bg-black">
      <Canvas
        shadows
        camera={{ fov: 65, position: [0, 1.7, 6] }}
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <color attach="background" args={[night ? "#0a0818" : "#241f3a"]} />
        <fog attach="fog" args={[night ? "#0a0818" : "#241f3a", 14, 42]} />
        <ambientLight intensity={night ? 0.5 : 0.85} color={night ? "#b8c2ff" : "#fff5e0"} />
        <hemisphereLight args={[night ? "#a78bfa" : "#fff5e0", night ? "#1a1530" : "#4a4570", night ? 0.6 : 0.9]} />
        <pointLight position={[0, WALL_H - 0.5, 0]} intensity={night ? 18 : 12} color={night ? "#c4b5fd" : "#fff0d8"} distance={26} />
        <pointLight position={[6, 3.5, 6]} intensity={night ? 9 : 5} color="#22d3ee" distance={16} />
        <pointLight position={[-6, 3.5, -6]} intensity={night ? 9 : 5} color="#f0abfc" distance={16} />

        <Suspense fallback={null}>
          <Floor />
          <Ceiling night={night} />
          <Wall night={night} position={[0, WALL_H / 2, -ROOM_SIZE / 2]} rotation={[0, 0, 0]} />
          <Wall night={night} position={[0, WALL_H / 2, ROOM_SIZE / 2]} rotation={[0, Math.PI, 0]} />
          <Wall night={night} position={[-ROOM_SIZE / 2, WALL_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
          <Wall night={night} position={[ROOM_SIZE / 2, WALL_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} />

          <Sculpture position={[-3, 0, 0]} kind="torus" />
          <Sculpture position={[3, 0, 0]} kind="ico" />

          {placed.map((a) => (
            <ArtworkFrame key={a.id} artwork={a} onFocus={handleFocus} onOpen={setSelected} />
          ))}

          <DustParticles count={400} color={night ? "#a78bfa" : "#fff0d8"} />
        </Suspense>

        <PlayerControls
          tour={tour}
          focus={focus}
          onFocusArrive={() => { /* arrived */ }}
          onTourEnd={() => { setTour(false); toast.success("Guided tour complete"); }}
        />
        {!tour && !focus && <PointerLockControls onLock={() => setLocked(true)} onUnlock={() => setLocked(false)} />}

        <CinematicEffects night={night} />
      </Canvas>

      <RoomMusicWatcher enabled={introDone && musicOn} />

      {/* Cinematic intro */}
      {!introDone && <CinematicIntro onEnter={() => setIntroDone(true)} />}

      {/* Step-inside overlay (after intro, before lock) */}
      {introDone && !locked && !tour && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/70 backdrop-blur-md">
          <div className="text-center max-w-md p-8 glass-strong rounded-2xl neon-border">
            <h3 className="font-display text-2xl font-bold neon-text">Step Inside</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Click to enter. <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">WASD</kbd> to move,
              mouse to look, click frames to view. <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">Esc</kbd> to exit.
            </p>
            <button
              onClick={requestLock}
              className="mt-6 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-neon-purple/30 hover:scale-105 transition"
            >
              Enter Gallery
            </button>
          </div>
        </div>
      )}

      {/* HUD overlays only when inside */}
      {introDone && (locked || tour) && !focusedArt && (
        <>
          <Minimap />

          {/* crosshair */}
          {locked && !tour && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-2 w-2 rounded-full bg-white/80 shadow shadow-white" />
            </div>
          )}

          {/* toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full glass-strong p-1.5 neon-border">
            <HudBtn label={night ? "Day mode" : "Night mode"} onClick={() => setNight((n) => !n)}>
              {night ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </HudBtn>
            <HudBtn label={tour ? "Stop tour" : "Guided tour"} onClick={() => setTour((t) => !t)}>
              {tour ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </HudBtn>
            <HudBtn label="Screenshot" onClick={takeScreenshot}>
              <Camera className="h-4 w-4" />
            </HudBtn>
            <HudBtn label="Fullscreen" onClick={enterFullscreen}>
              <Maximize className="h-4 w-4" />
            </HudBtn>
            <HudBtn label={musicOn ? "Mute music" : "Unmute"} onClick={() => setMusicOn((m) => !m)}>
              <span className="px-1 text-xs">{musicOn ? "♪" : "—"}</span>
            </HudBtn>
          </div>

          {/* room legend */}
          <div className="absolute bottom-4 left-4 z-20 hidden md:flex flex-col gap-1 rounded-2xl glass p-3 text-[10px]">
            <div className="uppercase tracking-[0.2em] text-neon-cyan mb-1">Rooms</div>
            {ROOMS.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                <span className="text-foreground/80">{r.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Focus mode overlay */}
      {focusedArt && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6">
          <div className="pointer-events-auto self-end flex gap-2">
            <button
              onClick={() => { setSelected(focusedArt); }}
              className="rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-5 py-2 text-sm font-medium text-white shadow-lg shadow-neon-purple/30 hover:scale-105 transition"
            >
              Open details
            </button>
            <button
              onClick={exitFocus}
              aria-label="Exit focus"
              className="grid h-10 w-10 place-items-center rounded-full glass-strong hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="pointer-events-none max-w-xl rounded-2xl glass-strong neon-border p-5">
            <span className="text-[10px] uppercase tracking-[0.25em] text-neon-cyan">
              {focusedArt.category} · {focusedArt.room}
            </span>
            <h3 className="mt-1 font-display text-2xl font-bold leading-tight">{focusedArt.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{focusedArt.artist} · {focusedArt.year}</p>
            <p className="mt-3 text-sm text-foreground/85 line-clamp-3">{focusedArt.description}</p>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Double-click any frame to open · Esc to exit focus
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function HudBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 transition"
    >
      {children}
    </button>
  );
}

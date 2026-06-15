import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

export function CinematicEffects({ night }: { night: boolean }) {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={night ? 0.7 : 0.35}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0004, 0.0004)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.35} darkness={night ? 0.55 : 0.35} />
      <Noise opacity={0.018} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

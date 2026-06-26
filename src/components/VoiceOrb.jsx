import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function ParticleSphere({ intensity = 0 }) {
  const COUNT = 4000;
  const pointsRef = useRef(null);
  const matRef = useRef(null);

  // base unit-sphere directions (fibonacci sphere)
  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const cA = new THREE.Color('#a46edb');
    const cB = new THREE.Color('#ff5fb0');
    const cC = new THREE.Color('#7aa0ff');
    const phi = Math.PI * (Math.sqrt(5) - 1);
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      const t = Math.random();
      const c = t < 0.6 ? cA : t < 0.85 ? cB : cC;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pts = pointsRef.current;
    if (!pts) return;

    // gentle rotation + cursor parallax
    pts.rotation.y = t * 0.08 + state.pointer.x * 0.3;
    pts.rotation.x = state.pointer.y * -0.25;

    // Vibrating pulse: scale between 1.0 and 1.06 based on intensity
    // intensity 0 → scale 1.0 (no vibration)
    // intensity 1 → scale pulses 1.0 to 1.06 at ~8Hz
    const pulse = intensity > 0
      ? 1 + Math.sin(t * 16) * (intensity * 0.06)
      : 1;
    pts.scale.setScalar(pulse);

    if (matRef.current) {
      matRef.current.size = 0.054 + intensity * 0.08;
      matRef.current.opacity = 0.75 + intensity * 0.15;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={matRef}
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export function VoiceOrb({ intensity = 0, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ display: 'block' }}
      >
        <ambientLight intensity={0.6} />
        <ParticleSphere intensity={intensity} />
      </Canvas>
    </div>
  );
}

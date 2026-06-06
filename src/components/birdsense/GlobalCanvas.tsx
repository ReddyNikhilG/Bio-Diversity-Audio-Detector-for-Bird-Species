import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "@/lib/birdsense/sceneStore";

/* ── A glowing wireframe bird made of particles ──────────────────────────── */
function ParticleBird() {
    const group = useRef<THREE.Group>(null!);
    const wingL = useRef<THREE.Mesh>(null!);
    const wingR = useRef<THREE.Mesh>(null!);
    const { scrollProgress, analyzing } = useScene();

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        const flapSpeed = analyzing ? 8 : 2.4;
        if (wingL.current) wingL.current.rotation.z = Math.sin(t * flapSpeed) * 0.55 - 0.1;
        if (wingR.current) wingR.current.rotation.z = -Math.sin(t * flapSpeed) * 0.55 + 0.1;
        if (group.current) {
            group.current.rotation.y += delta * 0.25;
            group.current.position.y = Math.sin(t * 1.2) * 0.25 - scrollProgress * 2.5;
            const s = 1 - scrollProgress * 0.4;
            group.current.scale.setScalar(s);
        }
    });

    const mat = (
        <meshStandardMaterial
            color="#1ed760"
            emissive="#a3e635"
            emissiveIntensity={0.7}
            roughness={0.25}
            metalness={0.6}
            wireframe
        />
    );

    return (
        <group ref={group}>
            {/* body */}
            <mesh scale={[1.8, 1, 1]}>
                <sphereGeometry args={[0.55, 18, 12]} />
                {mat}
            </mesh>
            {/* wings */}
            <mesh ref={wingL} position={[0, 0.1, -0.9]} scale={[1.6, 0.22, 0.8]}>
                <sphereGeometry args={[0.7, 10, 8]} />
                {mat}
            </mesh>
            <mesh ref={wingR} position={[0, 0.1, 0.9]} scale={[1.6, 0.22, 0.8]}>
                <sphereGeometry args={[0.7, 10, 8]} />
                {mat}
            </mesh>
            {/* tail */}
            <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.3, 0.9, 8]} />
                {mat}
            </mesh>
            {/* head */}
            <mesh position={[1.05, 0.18, 0]}>
                <sphereGeometry args={[0.34, 14, 10]} />
                {mat}
            </mesh>
            {/* beak */}
            <mesh position={[1.45, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.1, 0.35, 6]} />
                <meshStandardMaterial color="#fde047" emissive="#a3e635" emissiveIntensity={1.2} />
            </mesh>
        </group>
    );
}

/* ── Pulsing sound rings around the bird ─────────────────────────────────── */
function SoundRings() {
    const refs = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        refs.forEach((r, i) => {
            if (!r.current) return;
            const phase = (t * 0.6 + i * 0.5) % 2;
            const scale = 1 + phase * 1.4;
            r.current.scale.setScalar(scale);
            const mat = r.current.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, 0.45 * (1 - phase / 2));
        });
    });
    return (
        <>
            {refs.map((r, i) => (
                <mesh key={i} ref={r} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.8, 1.85, 64]} />
                    <meshBasicMaterial color="#1ed760" transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </>
    );
}

/* ── Ambient particle forest (drifting points) ───────────────────────────── */
function ParticleForest({ count = 1400 }: { count?: number }) {
    const ref = useRef<THREE.Points>(null!);
    const positions = useRef<Float32Array | null>(null);
    const { analyzing } = useScene();

    if (!positions.current) {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 30;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        positions.current = arr;
    }

    useFrame((state, delta) => {
        if (!ref.current) return;
        ref.current.rotation.y += delta * (analyzing ? 0.08 : 0.02);
        const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.0015;
        }
        pos.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
            </bufferGeometry>
            <pointsMaterial
                color="#1ed760"
                size={0.045}
                sizeAttenuation
                transparent
                opacity={0.65}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

/* ── Scroll-driven camera ────────────────────────────────────────────────── */
function ScrollCamera() {
    const { scrollProgress, mode } = useScene();
    useFrame((state) => {
        const cam = state.camera;
        if (mode === "landing") {
            const p = scrollProgress;
            // Hero -> pull back -> fly through pipeline -> end
            const targetZ = 6 + p * 8;
            const targetY = p * 0.8;
            const targetX = Math.sin(p * Math.PI * 2) * 1.2;
            cam.position.x += (targetX - cam.position.x) * 0.05;
            cam.position.y += (targetY - cam.position.y) * 0.05;
            cam.position.z += (targetZ - cam.position.z) * 0.05;
            cam.lookAt(0, 0, 0);
        } else {
            // App / about: gentle orbit
            const t = state.clock.elapsedTime * 0.1;
            cam.position.x = Math.sin(t) * 8;
            cam.position.z = Math.cos(t) * 8;
            cam.position.y = 1.5;
            cam.lookAt(0, 0, 0);
        }
    });
    return null;
}

/* ── Pipeline nodes (floating glass cubes along Z) ──────────────────────── */
const PIPELINE = [
    { label: "Preprocess", z: -4 },
    { label: "NMF", z: -8 },
    { label: "BirdNET", z: -12 },
    { label: "YAMNet", z: -16 },
    { label: "Perch", z: -20 },
];

function PipelineNodes() {
    const { scrollProgress, mode } = useScene();
    if (mode !== "landing") return null;
    return (
        <group>
            {PIPELINE.map((n, i) => {
                const lit = scrollProgress > 0.35 + i * 0.1;
                return (
                    <mesh key={n.label} position={[0, 0, n.z]} rotation={[0, scrollProgress * Math.PI, 0]}>
                        <boxGeometry args={[1.4, 1.4, 1.4]} />
                        <meshStandardMaterial
                            color={lit ? "#1ed760" : "#0a1628"}
                            emissive={lit ? "#a3e635" : "#0a1628"}
                            emissiveIntensity={lit ? 0.6 : 0.05}
                            transparent
                            opacity={0.85}
                            wireframe={!lit}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

export default function GlobalCanvas() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="global-canvas">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 55 }}
                dpr={[1, 1.6]}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.35} />
                <pointLight position={[6, 6, 6]} intensity={1.2} color="#1ed760" />
                <pointLight position={[-6, -2, -6]} intensity={0.6} color="#4F46E5" />
                <fog attach="fog" args={["#05080f", 8, 30]} />
                <ScrollCamera />
                <ParticleForest />
                <ParticleBird />
                <SoundRings />
                <PipelineNodes />
            </Canvas>
        </div>
    );
}

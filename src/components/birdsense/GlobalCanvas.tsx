import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "@/lib/birdsense/sceneStore";

/* ── A glowing wireframe + constellation bird ──────────────────────────── */
function ParticleBird() {
    const group = useRef<THREE.Group>(null!);
    const wingL = useRef<THREE.Group>(null!);
    const wingR = useRef<THREE.Group>(null!);
    const heartLight = useRef<THREE.PointLight>(null!);
    const { scrollProgress, analyzing } = useScene();

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        const flapSpeed = analyzing ? 9 : 2.5;
        const flapRange = analyzing ? 0.65 : 0.45;
        
        // Wing rotation (flapping twist & wave)
        const flap = Math.sin(t * flapSpeed);
        if (wingL.current) {
            wingL.current.rotation.z = flap * flapRange - 0.1;
            wingL.current.rotation.x = flap * 0.12;
            wingL.current.rotation.y = -flap * 0.08;
        }
        if (wingR.current) {
            wingR.current.rotation.z = -flap * flapRange + 0.1;
            wingR.current.rotation.x = -flap * 0.12;
            wingR.current.rotation.y = flap * 0.08;
        }

        // Bioluminescent heartbeat light pulse
        const pulse = Math.sin(t * (analyzing ? 6 : 2.2)) * 0.4 + 1.0;
        if (heartLight.current) {
            heartLight.current.intensity = pulse * 2.8;
            heartLight.current.distance = 4 + pulse * 1.5;
        }

        // Float bird gently & rotate based on scroll
        if (group.current) {
            group.current.rotation.y = Math.sin(t * 0.3) * 0.15 + scrollProgress * Math.PI * 0.5;
            group.current.position.y = Math.sin(t * 1.4) * 0.22 - scrollProgress * 2.5;
            group.current.position.x = Math.cos(t * 0.7) * 0.15;
            const s = 1.1 - scrollProgress * 0.45;
            group.current.scale.setScalar(s);
        }
    });

    const mat = (
        <meshStandardMaterial
            color="#1ed760"
            emissive="#a3e635"
            emissiveIntensity={0.25}
            roughness={0.15}
            metalness={0.8}
            wireframe
            transparent
            opacity={0.15}
        />
    );

    const pMat = (
        <pointsMaterial
            color="#a3e635"
            size={0.065}
            sizeAttenuation
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
    );

    return (
        <group ref={group}>
            {/* body */}
            <group scale={[1.8, 1, 1]}>
                <mesh>
                    <sphereGeometry args={[0.55, 18, 12]} />
                    {mat}
                </mesh>
                <points>
                    <sphereGeometry args={[0.55, 18, 12]} />
                    {pMat}
                </points>
                {/* Heart light inside bird body */}
                <pointLight ref={heartLight} color="#1ed760" intensity={2.5} distance={5} />
            </group>

            {/* wings - attached to shoulder hinge */}
            <group ref={wingL} position={[0, 0.1, -0.35]}>
                <group position={[0, 0, -0.55]} scale={[1.6, 0.22, 0.8]}>
                    <mesh>
                        <sphereGeometry args={[0.7, 12, 10]} />
                        {mat}
                    </mesh>
                    <points>
                        <sphereGeometry args={[0.7, 12, 10]} />
                        {pMat}
                    </points>
                </group>
            </group>

            <group ref={wingR} position={[0, 0.1, 0.35]}>
                <group position={[0, 0, 0.55]} scale={[1.6, 0.22, 0.8]}>
                    <mesh>
                        <sphereGeometry args={[0.7, 12, 10]} />
                        {mat}
                    </mesh>
                    <points>
                        <sphereGeometry args={[0.7, 12, 10]} />
                        {pMat}
                    </points>
                </group>
            </group>

            {/* tail */}
            <group position={[-1.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1.4, 1]}>
                <mesh>
                    <coneGeometry args={[0.3, 0.9, 8]} />
                    {mat}
                </mesh>
                <points>
                    <coneGeometry args={[0.3, 0.9, 8]} />
                    {pMat}
                </points>
            </group>

            {/* head */}
            <group position={[1.1, 0.2, 0]}>
                <mesh>
                    <sphereGeometry args={[0.34, 14, 10]} />
                    {mat}
                </mesh>
                <points>
                    <sphereGeometry args={[0.34, 14, 10]} />
                    {pMat}
                </points>
            </group>

            {/* beak */}
            <mesh position={[1.5, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.1, 0.38, 6]} />
                <meshStandardMaterial color="#fde047" emissive="#a3e635" emissiveIntensity={1.4} roughness={0.1} />
            </mesh>
        </group>
    );
}

/* ── Pulsing sound rings around the bird ─────────────────────────────────── */
function SoundRings() {
    const refs = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];
    const { analyzing } = useScene();

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const speed = analyzing ? 1.5 : 0.55;
        refs.forEach((r, i) => {
            if (!r.current) return;
            const phase = (t * speed + i * 0.55) % 2;
            const scale = 1 + phase * 1.5;
            r.current.scale.set(scale, scale, scale * (1 + Math.sin(t * 4.5 + i) * 0.06));
            const mat = r.current.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, 0.55 * (1 - phase / 2));
        });
    });

    return (
        <>
            {refs.map((r, i) => (
                <mesh key={i} ref={r} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.75, 1.82, 64]} />
                    <meshBasicMaterial color="#1ed760" transparent opacity={0.35} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </>
    );
}

/* ── Bioluminescent Forest Particles ───────────────────────────── */
function ParticleForest({ count = 1600 }: { count?: number }) {
    const ref = useRef<THREE.Points>(null!);
    const positions = useRef<Float32Array | null>(null);
    const colors = useRef<Float32Array | null>(null);
    const { analyzing } = useScene();

    if (!positions.current) {
        const posArr = new Float32Array(count * 3);
        const colArr = new Float32Array(count * 3);
        
        // Curated HSL-derived color palette
        const palette = [
            new THREE.Color("#1ed760"), // Emerald Green
            new THREE.Color("#a3e635"), // Electric Lime
            new THREE.Color("#0ea5e9"), // Sky Blue/Teal
            new THREE.Color("#6366f1"), // Indigo Glow
        ];

        for (let i = 0; i < count; i++) {
            posArr[i * 3] = (Math.random() - 0.5) * 36;
            posArr[i * 3 + 1] = (Math.random() - 0.5) * 20;
            posArr[i * 3 + 2] = (Math.random() - 0.5) * 36;

            const col = palette[Math.floor(Math.random() * palette.length)];
            colArr[i * 3] = col.r;
            colArr[i * 3 + 1] = col.g;
            colArr[i * 3 + 2] = col.b;
        }
        positions.current = posArr;
        colors.current = colArr;
    }

    useFrame((state, delta) => {
        if (!ref.current) return;
        ref.current.rotation.y += delta * (analyzing ? 0.08 : 0.022);
        
        const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        const t = state.clock.elapsedTime;
        
        // Fluid noise-like organic wind drift
        for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] += Math.sin(t * 0.4 + arr[i * 3]) * 0.0025;
            arr[i * 3] += Math.cos(t * 0.3 + arr[i * 3 + 2]) * 0.0018;
        }
        pos.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions.current!, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors.current!, 3]} />
            </bufferGeometry>
            <pointsMaterial
                vertexColors
                size={0.06}
                sizeAttenuation
                transparent
                opacity={0.8}
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
            // Smoothly interpolate positions to pull back & slide through nodes
            const targetZ = 6 + p * 8.5;
            const targetY = p * 0.85;
            const targetX = Math.sin(p * Math.PI * 2.2) * 1.3;
            cam.position.x += (targetX - cam.position.x) * 0.06;
            cam.position.y += (targetY - cam.position.y) * 0.06;
            cam.position.z += (targetZ - cam.position.z) * 0.06;
            cam.lookAt(0, 0, 0);
        } else {
            // Gentle orbit for App / About pages
            const t = state.clock.elapsedTime * 0.08;
            cam.position.x = Math.sin(t) * 8.5;
            cam.position.z = Math.cos(t) * 8.5;
            cam.position.y = 1.6;
            cam.lookAt(0, 0, 0);
        }
    });
    return null;
}

/* ── Pipeline nodes (3D Glass cubes + Wireframe outer shells) ──────────────────────── */
const PIPELINE = [
    { label: "Preprocess", z: -4 },
    { label: "NMF", z: -8 },
    { label: "BirdNET", z: -12 },
    { label: "YAMNet", z: -16 },
    { label: "Perch", z: -20 },
];

function PipelineNode({ n, i, scrollProgress }: { n: any, i: number, scrollProgress: number }) {
    const innerBox = useRef<THREE.Mesh>(null!);
    const lit = scrollProgress > 0.35 + i * 0.1;

    useFrame((state) => {
        if (!innerBox.current) return;
        const t = state.clock.elapsedTime + i * 8;
        innerBox.current.rotation.x = t * 0.22;
        innerBox.current.rotation.y = t * 0.35;
        innerBox.current.rotation.z = t * 0.15;
    });

    return (
        <group position={[0, 0, n.z]}>
            {/* Translucent glass core */}
            <mesh ref={innerBox}>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshStandardMaterial
                    color={lit ? "#1ed760" : "#0f1c30"}
                    emissive={lit ? "#a3e635" : "#060e19"}
                    emissiveIntensity={lit ? 0.95 : 0.1}
                    transparent
                    opacity={lit ? 0.65 : 0.3}
                    roughness={0.12}
                    metalness={0.88}
                />
            </mesh>
            {/* Outer spinning wireframe halo */}
            <mesh rotation={[0, scrollProgress * Math.PI * 1.5, 0]}>
                <boxGeometry args={[1.65, 1.65, 1.65]} />
                <meshStandardMaterial
                    color={lit ? "#a3e635" : "#0d1b33"}
                    wireframe
                    transparent
                    opacity={lit ? 0.45 : 0.1}
                />
            </mesh>
        </group>
    );
}

function PipelineNodes() {
    const { scrollProgress, mode } = useScene();
    if (mode !== "landing") return null;
    return (
        <group>
            {PIPELINE.map((n, i) => (
                <PipelineNode key={n.label} n={n} i={i} scrollProgress={scrollProgress} />
            ))}
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
                <ambientLight intensity={0.4} />
                <pointLight position={[6, 8, 6]} intensity={1.5} color="#1ed760" />
                <pointLight position={[-6, -4, -6]} intensity={0.9} color="#4F46E5" />
                <directionalLight position={[0, 10, 0]} intensity={0.5} color="#0ea5e9" />
                <fog attach="fog" args={["#04070d", 8, 32]} />
                <ScrollCamera />
                <ParticleForest />
                <ParticleBird />
                <SoundRings />
                <PipelineNodes />
            </Canvas>
        </div>
    );
}

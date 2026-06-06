import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/about")({
    head: () => ({
        meta: [
            { title: "About — BirdSense" },
            { name: "description", content: "How BirdSense identifies overlapping bird species using NMF source separation and a BirdNET + YAMNet + Perch ensemble." },
            { property: "og:title", content: "About BirdSense" },
            { property: "og:description", content: "Inside the bioacoustic ensemble." },
        ],
    }),
    component: About,
});

const STEPS = [
    {
        step: "①", title: "Preprocessing", icon: "🔧",
        body: "Audio is resampled to 32 kHz mono, normalized, and denoised. Silent or corrupted clips are rejected before they ever reach the GPU.",
    },
    {
        step: "②", title: "NMF source separation", icon: "🎛️",
        body: "Non-negative matrix factorization decomposes the magnitude spectrogram into N rank-1 components. Each component becomes its own audio stem the models can analyze in isolation.",
    },
    {
        step: "③", title: "BirdNET", icon: "🐦",
        badge: "weight 0.55",
        badgeColor: "#1ed760",
        body: "Cornell Lab's specialist bird model runs first. Optional geographic latitude/longitude and week-of-year filters narrow the candidate species to what is plausible at the recording site and season.",
    },
    {
        step: "④", title: "YAMNet", icon: "🎵",
        badge: "weight 0.20",
        badgeColor: "#fbbf24",
        body: "Google's general audio model verifies that each stem actually contains bird-like vocalizations rather than wind, water, or machinery — preventing false positives on noise.",
    },
    {
        step: "⑤", title: "Google Perch", icon: "🔬",
        badge: "weight 0.25",
        badgeColor: "#a5b4fc",
        body: "A second specialist embedding cross-checks BirdNET's top predictions. Agreement raises confidence; disagreement triggers further inspection.",
    },
    {
        step: "⑥", title: "Temporal voting", icon: "🗳️",
        body: "Predictions are aggregated across time windows and stems. The final output is a ranked list of species with confidence, timestamps, and per-window evidence.",
    },
];

function About() {
    return (
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "140px 32px 80px" }}>

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="pill pill-accent" style={{ marginBottom: 24 }}>
                    <span>🔬</span>
                    Technical overview
                </div>
                <h1 className="font-display" style={{
                    fontWeight: 900, fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
                    lineHeight: 1.04, marginBottom: 24,
                }}>
                    Inside <span className="gradient-text">BirdSense</span>.
                </h1>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .12 }}
                style={{ color: "var(--text-muted)", fontSize: "1.08rem", lineHeight: 1.85, marginBottom: 52, maxWidth: 720 }}
            >
                BirdSense is a bioacoustic species-detection pipeline built for the messy reality of field recordings —
                wind, traffic, rustling leaves, and several birds calling at the same time. Instead of forcing a single
                classifier to pick one winner, we separate the audio into source stems and let{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>three specialist models</span> vote on each stem independently.
            </motion.p>

            {/* Pipeline timeline */}
            <div style={{ position: "relative" }}>
                {/* Vertical line */}
                <div style={{
                    position: "absolute", left: 19, top: 40, bottom: 40,
                    width: 2,
                    background: "linear-gradient(to bottom, rgba(30,215,96,0.5), rgba(30,215,96,0.08))",
                }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.step}
                            className="timeline-item"
                            initial={{ opacity: 0, x: -16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07 }}
                            style={{ marginBottom: i < STEPS.length - 1 ? 24 : 0 }}
                        >
                            {/* Dot */}
                            <div className="timeline-dot" style={{ zIndex: 1, flexShrink: 0 }}>
                                <span>{s.icon}</span>
                            </div>

                            {/* Card */}
                            <div
                                className="glass"
                                style={{ flex: 1, padding: "20px 24px", borderRadius: 18 }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(30,215,96,0.25)")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                                    <h2 className="font-display" style={{
                                        fontWeight: 800, fontSize: "1.1rem",
                                        color: "var(--accent)",
                                    }}>
                                        {s.step} {s.title}
                                    </h2>
                                    {s.badge && (
                                        <span style={{
                                            background: `${s.badgeColor}14`,
                                            border: `1px solid ${s.badgeColor}40`,
                                            borderRadius: 999, padding: "2px 12px",
                                            fontSize: ".72rem", color: s.badgeColor, fontWeight: 800,
                                            fontFamily: "var(--font-display)",
                                        }}>
                                            {s.badge}
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: "var(--text-muted)", lineHeight: 1.75, fontSize: ".94rem" }}>
                                    {s.body}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Model weight summary */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="glass"
                style={{ padding: "28px 32px", marginTop: 40 }}
            >
                <h3 className="font-display" style={{ fontWeight: 800, fontSize: "1.15rem", marginBottom: 20 }}>
                    Ensemble weights at a glance
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                        { name: "BirdNET", weight: 0.55, color: "#1ed760", icon: "🐦" },
                        { name: "Perch",   weight: 0.25, color: "#a5b4fc", icon: "🔬" },
                        { name: "YAMNet", weight: 0.20, color: "#fbbf24", icon: "🎵" },
                    ].map((m) => (
                        <div key={m.name}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span>{m.icon}</span>
                                    <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{m.name}</span>
                                </div>
                                <span style={{ fontSize: ".82rem", fontWeight: 800, color: m.color, fontFamily: "var(--font-display)" }}>
                                    {(m.weight * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="conf-bar-track">
                                <motion.div
                                    className="conf-bar-fill"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${m.weight * 100}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                    style={{ background: `linear-gradient(90deg, ${m.color}60, ${m.color})` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="glass"
                style={{ padding: "32px", marginTop: 32, textAlign: "center" }}
            >
                <p style={{ fontSize: "1.6rem", marginBottom: 12 }}>🌿</p>
                <p className="font-display" style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 8 }}>
                    Ready to listen?
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: ".9rem", marginBottom: 24, maxWidth: 380, marginInline: "auto" }}>
                    Connect your Colab GPU and upload a field recording to get started.
                </p>
                <Link to="/app" className="btn btn-primary" style={{ textDecoration: "none" }}>
                    Open the analyzer →
                </Link>
            </motion.div>
        </div>
    );
}

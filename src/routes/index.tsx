import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "BirdSense — Hear every bird in the forest" },
            { name: "description", content: "Upload bird audio with overlapping calls. BirdSense separates the sources and identifies every species with a BirdNET + YAMNet + Perch ensemble." },
            { property: "og:title", content: "BirdSense" },
            { property: "og:description", content: "Bioacoustic species detection powered by an AI ensemble on a Colab GPU." },
        ],
    }),
    component: Landing,
});

const Section = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <section className="section" style={style}>
        {children}
    </section>
);

const fadeUp = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

function Landing() {
    return (
        <div>
            {/* ── HERO ────────────────────────────────────────────────────── */}
            <Section>
                <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                    <motion.div initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
                        {/* Badge */}
                        <div className="pill pill-accent" style={{ marginBottom: 32 }}>
                            <span className="status-dot status-dot-ok anim-pulse" />
                            GPU-Accelerated · BirdNET + YAMNet + Perch
                        </div>

                        {/* Headline */}
                        <h1 className="font-display" style={{
                            fontWeight: 900, fontSize: "clamp(2.8rem, 8vw, 6rem)",
                            lineHeight: 1.0, marginBottom: 28, maxWidth: 860,
                        }}>
                            Hear every bird<br />
                            in the <span className="gradient-text">forest</span>.
                        </h1>

                        {/* Subtitle */}
                        <p style={{ color: "var(--text-muted)", fontSize: "1.18rem", lineHeight: 1.75, maxWidth: 560, marginBottom: 40 }}>
                            Upload field audio with overlapping calls. We separate the sources and
                            identify every species with a weighted neural ensemble running on a Colab GPU.
                        </p>

                        {/* CTAs */}
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <Link to="/app" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
                                🚀 Launch the analyzer
                            </Link>
                            <Link to="/about" className="btn btn-ghost" style={{ textDecoration: "none", padding: "13px 24px" }}>
                                How it works ↓
                            </Link>
                        </div>

                        {/* Floating stats row */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.7 }}
                            style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 56 }}
                        >
                            {[
                                { value: "6,000+", label: "Bird species" },
                                { value: "3", label: "Neural models" },
                                { value: "NMF", label: "Source separation" },
                                { value: "GPU", label: "Colab backend" },
                            ].map((stat) => (
                                <div key={stat.label} style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: 14,
                                    padding: "12px 20px",
                                    minWidth: 110,
                                }}>
                                    <p className="font-display" style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--accent)" }}>
                                        {stat.value}
                                    </p>
                                    <p style={{ color: "var(--text-muted)", fontSize: ".78rem", marginTop: 2 }}>{stat.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
                <ScrollHint />
            </Section>

            {/* ── PROBLEM ─────────────────────────────────────────────────── */}
            <Section style={{ background: "linear-gradient(to bottom, transparent, rgba(10,22,40,0.4) 50%, transparent)" }}>
                <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
                    <motion.div {...fadeUp}>
                        <p className="label-overline" style={{ marginBottom: 18 }}>The challenge</p>
                        <h2 className="font-display" style={{
                            fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.6rem)",
                            marginBottom: 24, lineHeight: 1.08,
                        }}>
                            One forest. Dozens of species.<br />
                            <span className="gradient-text">All singing at once.</span>
                        </h2>
                    </motion.div>
                    <motion.p {...fadeUp} transition={{ delay: .12 }}
                        style={{ color: "var(--text-muted)", fontSize: "1.12rem", maxWidth: 640, lineHeight: 1.8 }}
                    >
                        Off-the-shelf classifiers collapse on overlapping calls. Single-stream inference
                        picks the loudest bird and misses the rest. We solve that with{" "}
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>source separation first</span>,
                        then ensemble inference — so every voice in the recording gets heard.
                    </motion.p>
                </div>
            </Section>

            {/* ── PIPELINE ─────────────────────────────────────────────────── */}
            <Section>
                <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
                    <motion.div {...fadeUp}>
                        <p className="label-overline" style={{ marginBottom: 14 }}>The pipeline</p>
                        <h2 className="font-display" style={{
                            fontWeight: 800, fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                            marginBottom: 52, maxWidth: 680, lineHeight: 1.1,
                        }}>
                            Five stages from raw audio<br />to ranked species list.
                        </h2>
                    </motion.div>

                    <div style={{ display: "grid", gap: 0 }}>
                        {[
                            { n: "01", label: "Preprocess", icon: "🔧", body: "Resample to 32 kHz mono, normalize, denoise. Reject silent / corrupted clips." },
                            { n: "02", label: "NMF separation", icon: "🎛️", body: "Non-negative matrix factorization splits the spectrogram into N source stems." },
                            { n: "03", label: "BirdNET (lead)", icon: "🐦", body: "Cornell's BirdNET runs per stem, with geographic + temporal filtering." },
                            { n: "04", label: "YAMNet + Perch", icon: "🎵", body: "YAMNet validates that the stem is bird-like; Google Perch provides peer review." },
                            { n: "05", label: "Temporal vote", icon: "🗳️", body: "Weighted ensemble + per-window voting produces the final ranked predictions." },
                        ].map((s, i) => (
                            <div key={s.n} style={{ position: "relative" }}>
                                {i < 4 && (
                                    <div style={{
                                        position: "absolute", left: 44, top: "100%",
                                        width: 2, height: 16,
                                        background: "linear-gradient(to bottom, rgba(30,215,96,0.4), rgba(30,215,96,0.08))",
                                        zIndex: 1,
                                    }} />
                                )}
                                <motion.div
                                    initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                    className="glass"
                                    style={{
                                        padding: "20px 28px",
                                        display: "flex", alignItems: "center", gap: 24,
                                        borderRadius: 16,
                                        marginBottom: i < 4 ? 0 : 0,
                                    }}
                                >
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                                        background: "rgba(30,215,96,0.07)",
                                        border: "1px solid rgba(30,215,96,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.4rem",
                                    }}>
                                        {s.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p className="font-display" style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>
                                            {s.label}
                                        </p>
                                        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.6 }}>{s.body}</p>
                                    </div>
                                    <span className="font-display gradient-text" style={{ fontSize: "2rem", fontWeight: 900, minWidth: 50, textAlign: "right", opacity: 0.7 }}>
                                        {s.n}
                                    </span>
                                </motion.div>
                                {i < 4 && <div style={{ height: 16 }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── MODELS ───────────────────────────────────────────────────── */}
            <Section>
                <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
                    <motion.div {...fadeUp}>
                        <p className="label-overline" style={{ marginBottom: 14 }}>AI ensemble</p>
                        <h2 className="font-display" style={{
                            fontWeight: 800, fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                            marginBottom: 52, lineHeight: 1.1,
                        }}>
                            Three models. <span className="gradient-text">One verdict.</span>
                        </h2>
                    </motion.div>

                    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                        {[
                            {
                                name: "BirdNET", weight: "0.55", role: "Lead classifier", icon: "🐦",
                                color: "#1ed760",
                                body: "Cornell Lab's specialist bird model — 6,000+ species, geographic & temporal priors.",
                            },
                            {
                                name: "YAMNet", weight: "0.20", role: "Audio gatekeeper", icon: "🎵",
                                color: "#fbbf24",
                                body: "Google's general audio model verifies stems actually contain bird vocalizations.",
                            },
                            {
                                name: "Perch", weight: "0.25", role: "Peer review", icon: "🔬",
                                color: "#a5b4fc",
                                body: "Google Perch cross-checks predictions with a second specialist embedding.",
                            },
                        ].map((m, i) => (
                            <motion.div
                                key={m.name}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -7, transition: { duration: 0.25 } }}
                                className="glass"
                                style={{ padding: 32 }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: `${m.color}14`,
                                        border: `1px solid ${m.color}32`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.5rem",
                                    }}>
                                        {m.icon}
                                    </div>
                                    <span style={{
                                        background: `${m.color}14`, border: `1px solid ${m.color}40`,
                                        borderRadius: 999, padding: "4px 12px",
                                        fontSize: ".72rem", color: m.color, fontWeight: 800,
                                        fontFamily: "var(--font-display)",
                                    }}>
                                        w = {m.weight}
                                    </span>
                                </div>
                                <h3 className="font-display" style={{ fontWeight: 800, fontSize: "1.5rem", color: m.color, marginBottom: 4 }}>
                                    {m.name}
                                </h3>
                                <p style={{ color: "var(--text-primary)", fontSize: ".85rem", fontWeight: 600, marginBottom: 10 }}>
                                    {m.role}
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: ".88rem", lineHeight: 1.65 }}>{m.body}</p>
                                {/* Weight bar */}
                                <div style={{ marginTop: 20 }}>
                                    <div className="conf-bar-track">
                                        <div className="conf-bar-fill" style={{
                                            width: `${parseFloat(m.weight) * 100}%`,
                                            background: `linear-gradient(90deg, ${m.color}80, ${m.color})`,
                                        }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <Section style={{ minHeight: "70vh", justifyContent: "center" }}>
                <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", width: "100%" }}>
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: 20,
                            background: "linear-gradient(135deg, rgba(30,215,96,0.15), rgba(30,215,96,0.05))",
                            border: "1px solid rgba(30,215,96,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "2rem", margin: "0 auto 28px",
                            boxShadow: "0 0 40px rgba(30,215,96,0.15)",
                        }}>🌿</div>
                        <h2 className="font-display" style={{
                            fontWeight: 900, fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
                            marginBottom: 20, lineHeight: 1.05,
                        }}>
                            Spin up your Colab.<br />
                            <span className="gradient-text">Hear the forest.</span>
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "1.08rem", marginBottom: 38, maxWidth: 500, marginInline: "auto", lineHeight: 1.75 }}>
                            Plug in your tunnel URL, drop an audio file, and watch the pipeline run in real time.
                        </p>
                        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                            <Link to="/app" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
                                Launch the analyzer →
                            </Link>
                            <Link to="/about" className="btn btn-ghost" style={{ textDecoration: "none", padding: "15px 26px" }}>
                                Learn more
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </Section>

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <footer style={{
                padding: "32px", textAlign: "center",
                borderTop: "1px solid var(--border-subtle)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: "linear-gradient(135deg, #1ed760, #a3e635)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#04140a", fontWeight: 900,
                    }}>B</span>
                    <span className="font-display" style={{ fontWeight: 700, fontSize: ".9rem" }}>BirdSense</span>
                </div>
                <p style={{ color: "var(--text-subtle)", fontSize: ".75rem" }}>
                    Bioacoustic species detection · BirdNET + YAMNet + Perch ensemble · {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}

function ScrollHint() {
    return (
        <div style={{
            position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
            color: "var(--text-muted)", fontSize: ".72rem", letterSpacing: 2.5, textTransform: "uppercase",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
            <div className="anim-float" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, transparent, var(--accent))", opacity: 0.5 }} />
                Scroll
            </div>
        </div>
    );
}

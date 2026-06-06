import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/birdsense/store";
import type { PipelineStage } from "@/lib/birdsense/types";

const STAGES: Array<{ id: PipelineStage; label: string; icon: string; desc: string }> = [
    { id: "upload",     label: "Uploading audio",       icon: "📤", desc: "Sending file to Colab GPU" },
    { id: "preprocess", label: "Preprocessing",          icon: "🔧", desc: "Resampling, normalizing, denoising" },
    { id: "separation", label: "NMF separation",         icon: "🎛️", desc: "Splitting into source stems" },
    { id: "birdnet",    label: "BirdNET inference",      icon: "🐦", desc: "Lead classifier — 6,000+ species" },
    { id: "yamnet",     label: "YAMNet validation",      icon: "🎵", desc: "Noise validation & gating" },
    { id: "perch",      label: "Perch peer review",      icon: "🔬", desc: "Google Perch cross-check" },
    { id: "voting",     label: "Temporal voting",        icon: "🗳️", desc: "Weighted ensemble & ranking" },
];

export default function ProgressTracker() {
    const { analyzing, currentStage, progressPct, progressMsg, elapsedMs } = useStore();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef<number>(0);

    useEffect(() => {
        if (analyzing) {
            startRef.current = Date.now();
            timerRef.current = setInterval(() => {
                useStore.setState({ elapsedMs: Date.now() - startRef.current });
            }, 500);
        } else if (timerRef.current) clearInterval(timerRef.current);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [analyzing]);

    const elapsed = (elapsedMs / 1000).toFixed(1);

    const getStageStatus = (stageId: PipelineStage) => {
        const idx = STAGES.findIndex((s) => s.id === stageId);
        const curIdx = STAGES.findIndex((s) => s.id === currentStage);
        if (currentStage === "complete") return "done";
        if (idx < curIdx) return "done";
        if (idx === curIdx) return "active";
        return "pending";
    };

    return (
        <AnimatePresence>
            {analyzing && (
                <motion.div
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
                    className="glass glass-accent"
                    style={{ padding: "28px 32px", marginBottom: 24 }}
                >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                background: "rgba(30,215,96,0.1)",
                                border: "1px solid rgba(30,215,96,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.3rem",
                            }}>🛰️</div>
                            <div>
                                <h3 className="font-display" style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 3 }}>
                                    Colab GPU Analysis
                                </h3>
                                <p style={{ color: "var(--text-muted)", fontSize: ".82rem" }}>
                                    {progressMsg || "Initializing pipeline…"}
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--accent)", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                                {progressPct}%
                            </p>
                            <p style={{ color: "var(--text-muted)", fontSize: ".75rem", marginTop: 3 }}>⏱ {elapsed}s</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="progress-track" style={{ marginBottom: 24 }}>
                        <motion.div
                            className="progress-fill"
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                    </div>

                    {/* Stage list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {STAGES.map((stage, i) => {
                            const status = getStageStatus(stage.id);
                            return (
                                <div key={stage.id} style={{ position: "relative" }}>
                                    {/* Vertical connector line */}
                                    {i < STAGES.length - 1 && (
                                        <div style={{
                                            position: "absolute", left: 17, top: "100%",
                                            width: 2, height: 10,
                                            background: status === "done"
                                                ? "rgba(74,222,128,0.4)"
                                                : "rgba(255,255,255,0.06)",
                                            zIndex: 0,
                                        }} />
                                    )}
                                    <div
                                        className={`stage-row ${status}`}
                                        style={{ opacity: status === "pending" ? 0.38 : 1, position: "relative", zIndex: 1 }}
                                    >
                                        <div className="stage-icon-wrap">
                                            {status === "active"
                                                ? <span className="spinner" style={{ width: 16, height: 16 }} />
                                                : <span>{status === "done" ? "✓" : stage.icon}</span>
                                            }
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{
                                                fontSize: ".88rem", fontWeight: status === "active" ? 600 : 400,
                                                color: status === "active" ? "var(--text-primary)" : undefined,
                                            }}>
                                                {stage.label}
                                            </span>
                                            {status === "active" && (
                                                <p style={{ fontSize: ".73rem", color: "var(--text-muted)", marginTop: 1 }}>
                                                    {stage.desc}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: ".72rem",
                                            color: status === "done" ? "var(--success)" : "var(--text-subtle)",
                                            fontWeight: status === "done" ? 700 : 400,
                                        }}>
                                            {status === "done" ? "Done" : status === "active" ? "Running…" : ""}
                                        </span>
                                    </div>
                                    {i < STAGES.length - 1 && <div style={{ height: 10 }} />}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

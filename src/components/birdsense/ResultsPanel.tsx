import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/birdsense/store";
import { fetchWiki } from "@/lib/birdsense/api";
import type { WikiInfo, Prediction } from "@/lib/birdsense/types";

function ConfidenceRing({ value }: { value: number }) {
    const R = 44;
    const CIRC = 2 * Math.PI * R;
    const offset = CIRC * (1 - value);
    const pct = (value * 100).toFixed(1);
    const color = value >= 0.8 ? "#1ed760" : value >= 0.5 ? "#fbbf24" : "#f87171";
    const bgColor = value >= 0.8 ? "rgba(30,215,96,0.08)" : value >= 0.5 ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)";
    return (
        <div style={{
            position: "relative", width: 100, height: 100, flexShrink: 0,
            background: bgColor, borderRadius: "50%",
        }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle
                    cx="50" cy="50" r={R} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={CIRC}
                    initial={{ strokeDashoffset: CIRC }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }}
                    style={{ filter: `drop-shadow(0 0 10px ${color}99)` }}
                />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="font-display" style={{ fontWeight: 900, fontSize: "1.25rem", color }}>{pct}%</span>
                <span style={{ fontSize: ".65rem", color: "var(--text-muted)", letterSpacing: 1 }}>CONF</span>
            </div>
        </div>
    );
}

function RankBadge({ index }: { index: number }) {
    const medals = ["🥇", "🥈", "🥉"];
    if (index < 3) {
        return (
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }} title={`#${index + 1} detection`}>
                {medals[index]}
            </span>
        );
    }
    return (
        <span style={{
            fontSize: ".72rem", fontWeight: 800, color: "var(--text-muted)",
            background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 6px",
        }}>
            #{index + 1}
        </span>
    );
}

function SpeciesCard({ pred, index }: { pred: Prediction; index: number }) {
    const [wiki, setWiki] = useState<WikiInfo | null>(null);
    useEffect(() => { fetchWiki(pred.species).then(setWiki); }, [pred.species]);
    const isPrimary = index === 0;
    const confColor = pred.confidence >= 0.8 ? "#1ed760" : pred.confidence >= 0.5 ? "#fbbf24" : "#f87171";

    return (
        <motion.div
            className={`species-card${isPrimary ? " primary" : ""}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.09 }}
        >
            {/* Image header */}
            {wiki?.image_url ? (
                <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                    <img src={wiki.image_url} alt={wiki.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(4,7,13,0.97) 100%)" }} />
                    {isPrimary && (
                        <div style={{
                            position: "absolute", top: 12, left: 12,
                            background: "var(--accent)", color: "#04140a",
                            borderRadius: 8, padding: "3px 12px",
                            fontSize: ".7rem", fontWeight: 900, letterSpacing: 1,
                        }}>
                            #1 DETECTION
                        </div>
                    )}
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                        <RankBadge index={index} />
                    </div>
                </div>
            ) : (
                <div style={{
                    height: 80, background: "linear-gradient(135deg, rgba(30,215,96,0.06), rgba(79,70,229,0.06))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                    borderBottom: "1px solid var(--border-subtle)",
                }}>
                    <span style={{ fontSize: "2.5rem", opacity: 0.4 }}>🐦</span>
                    {isPrimary && (
                        <div style={{
                            position: "absolute", top: 10, left: 12,
                            background: "var(--accent)", color: "#04140a",
                            borderRadius: 8, padding: "3px 12px",
                            fontSize: ".7rem", fontWeight: 900, letterSpacing: 1,
                        }}>
                            #1 DETECTION
                        </div>
                    )}
                    <div style={{ position: "absolute", top: 10, right: 12 }}>
                        <RankBadge index={index} />
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ padding: "18px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="font-display" style={{
                            fontWeight: 800,
                            fontSize: isPrimary ? "1.18rem" : "1rem",
                            color: isPrimary ? "var(--accent)" : "var(--text-primary)",
                            marginBottom: 4,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                            {pred.common_name || pred.species}
                        </h3>
                        <p style={{ color: "var(--text-muted)", fontSize: ".8rem", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {pred.species}
                        </p>
                    </div>
                    <ConfidenceRing value={pred.confidence} />
                </div>

                {/* Confidence bar */}
                <div style={{ marginBottom: 12 }}>
                    <div className="conf-bar-track">
                        <motion.div
                            className="conf-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pred.confidence * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.3 + index * 0.09 }}
                            style={{ background: `linear-gradient(90deg, ${confColor}60, ${confColor})` }}
                        />
                    </div>
                </div>

                {/* Timestamps */}
                {pred.timestamps && pred.timestamps.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {pred.timestamps.slice(0, 5).map((ts, i) => (
                            <span key={i} style={{
                                fontSize: ".7rem", padding: "2px 8px", borderRadius: 6,
                                background: "rgba(30,215,96,0.07)", color: "var(--accent)",
                                border: "1px solid rgba(30,215,96,0.18)",
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {ts.start.toFixed(1)}–{ts.end.toFixed(1)}s
                            </span>
                        ))}
                    </div>
                )}

                {/* Wiki summary */}
                {wiki?.summary && (
                    <p style={{ fontSize: ".82rem", color: "var(--text-muted)", lineHeight: 1.58 }}>
                        {wiki.summary.slice(0, 200)}{wiki.summary.length > 200 ? "…" : ""}
                    </p>
                )}
                {wiki?.url && (
                    <a
                        href={wiki.url} target="_blank" rel="noreferrer"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            marginTop: 10, color: "var(--accent)", fontSize: ".78rem", fontWeight: 600,
                            textDecoration: "none",
                            transition: "opacity .2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                        Read on Wikipedia →
                    </a>
                )}
            </div>
        </motion.div>
    );
}

export default function ResultsPanel() {
    const { result, resetAnalysis } = useStore();
    if (!result) return null;

    const predictions = result.predictions ?? [];
    const elapsed = result.elapsed_seconds.toFixed(1);

    const downloadReport = () => {
        const lines = [
            "╔════════════════════════════════════════════════════╗",
            "║        BIRDSENSE — BIODIVERSITY DETECTION REPORT  ║",
            "╚════════════════════════════════════════════════════╝",
            "",
            `File      : ${result.file}`,
            `Timestamp : ${new Date().toLocaleString()}`,
            `Elapsed   : ${elapsed}s (Colab GPU)`,
            `Run ID    : ${result.run_id}`,
            "",
            "DETECTED SPECIES",
            "─".repeat(50),
            ...predictions.map((p, i) =>
                `  [${String(i + 1).padStart(2)}] ${(p.common_name || p.species).padEnd(30)} ${(p.confidence * 100).toFixed(2)}%`,
            ),
            "",
            "Powered by BirdNET + YAMNet + Google Perch ensemble",
        ].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([lines], { type: "text/plain" }));
        a.download = `birdsense_report_${Date.now()}.txt`;
        a.click();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                className="glass glass-accent"
                style={{ padding: "28px 32px", marginBottom: 24 }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                            background: "rgba(30,215,96,0.1)",
                            border: "1px solid rgba(30,215,96,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.4rem",
                        }}>🏆</div>
                        <div>
                            <h2 className="font-display" style={{ fontWeight: 800, fontSize: "1.2rem" }}>Detection Results</h2>
                            <p style={{ color: "var(--text-muted)", fontSize: ".82rem", marginTop: 2 }}>
                                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{predictions.length} species</span>
                                {" · "}{elapsed}s · {result.file}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={downloadReport}>
                            📥 Report
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={resetAnalysis}>
                            🔄 New analysis
                        </button>
                    </div>
                </div>

                {/* Summary stats */}
                {predictions.length > 0 && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                        <div className="pill pill-accent">
                            <span>🎯</span>
                            Top: {(predictions[0].confidence * 100).toFixed(1)}% confidence
                        </div>
                        <div className="pill" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                            ⏱ {elapsed}s on GPU
                        </div>
                        {predictions[0].common_name && (
                            <div className="pill" style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.3)", color: "#a5b4fc" }}>
                                🐦 {predictions[0].common_name}
                            </div>
                        )}
                    </div>
                )}

                {/* Species grid or empty */}
                {predictions.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔍</span>
                        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", marginBottom: 8 }}>
                            No bird species detected
                        </p>
                        <p style={{ color: "var(--text-subtle)", fontSize: ".8rem" }}>
                            Try cleaner audio or reduce NMF sources to 1–2
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}>
                        {predictions.map((pred, i) => (
                            <SpeciesCard key={pred.species + i} pred={pred} index={i} />
                        ))}
                    </div>
                )}

                {/* Raw data table */}
                {result.raw_data?.length > 0 && (
                    <details style={{ marginTop: 24 }}>
                        <summary style={{
                            cursor: "pointer", color: "var(--text-muted)", fontSize: ".85rem",
                            fontWeight: 600, userSelect: "none", padding: "10px 0",
                            borderTop: "1px solid var(--border-subtle)",
                            marginTop: 4,
                        }}>
                            🔬 Raw Data Matrix ({result.raw_data.length} rows)
                        </summary>
                        <div style={{ marginTop: 14, overflowX: "auto", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {Object.keys(result.raw_data[0]).slice(0, 8).map((k) => <th key={k}>{k}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.raw_data.slice(0, 10).map((row, i) => (
                                        <tr key={i}>
                                            {Object.entries(row).slice(0, 8).map(([k, v]) => (
                                                <td key={k}>{typeof v === "number" ? Number(v).toFixed(4) : String(v)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

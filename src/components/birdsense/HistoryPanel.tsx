import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/birdsense/store";

export default function HistoryPanel() {
    const { history, clearHistory } = useStore();

    return (
        <section style={{ padding: "8px 0 80px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                    <h2 className="font-display" style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>
                        Analysis History
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: ".82rem" }}>
                        {history.length === 0
                            ? "Your completed analyses will appear here"
                            : `${history.length} completed analysis${history.length !== 1 ? "es" : ""}`
                        }
                    </p>
                </div>
                {history.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={clearHistory} style={{ color: "var(--danger)", borderColor: "rgba(248,113,113,0.25)" }}>
                        🗑 Clear all
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <p style={{ color: "var(--text-muted)", fontSize: ".95rem", fontWeight: 500, marginBottom: 6 }}>
                        No analyses yet
                    </p>
                    <p style={{ color: "var(--text-subtle)", fontSize: ".82rem" }}>
                        Upload an audio file and run the analyzer to get started
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
                    <AnimatePresence>
                        {history.map((h) => (
                            <motion.div
                                key={h.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="history-card"
                            >
                                {/* Card header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: "1rem" }}>🎵</span>
                                            <p style={{
                                                fontWeight: 700, fontSize: ".88rem",
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                            }}>
                                                {h.filename}
                                            </p>
                                        </div>
                                        <p style={{ color: "var(--text-muted)", fontSize: ".72rem" }}>
                                            {new Date(h.timestamp).toLocaleString()} · {h.elapsed_seconds.toFixed(1)}s
                                        </p>
                                    </div>
                                    <span className="pill pill-accent" style={{ fontSize: ".68rem", padding: "2px 10px", flexShrink: 0, marginLeft: 8 }}>
                                        {h.predictions.length} spp
                                    </span>
                                </div>

                                <div className="divider" style={{ margin: "10px 0" }} />

                                {/* Predictions list */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {h.predictions.slice(0, 3).map((p, j) => (
                                        <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                                <span style={{ fontSize: ".85rem", flexShrink: 0 }}>
                                                    {j === 0 ? "🥇" : j === 1 ? "🥈" : "🥉"}
                                                </span>
                                                <span style={{
                                                    fontSize: ".82rem",
                                                    color: j === 0 ? "var(--accent)" : "var(--text-primary)",
                                                    fontWeight: j === 0 ? 700 : 400,
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                }}>
                                                    {p.common_name || p.species}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: ".72rem",
                                                color: p.confidence >= 0.8 ? "var(--success)" : p.confidence >= 0.5 ? "var(--warning)" : "var(--danger)",
                                                background: "rgba(255,255,255,0.05)",
                                                borderRadius: 5, padding: "1px 7px",
                                                fontWeight: 700, flexShrink: 0,
                                                fontVariantNumeric: "tabular-nums",
                                            }}>
                                                {(p.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                    {h.predictions.length > 3 && (
                                        <p style={{ color: "var(--text-subtle)", fontSize: ".72rem", textAlign: "center", marginTop: 4 }}>
                                            +{h.predictions.length - 3} more species
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </section>
    );
}

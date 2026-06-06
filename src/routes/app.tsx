import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/birdsense/store";
import { submitAnalysis, streamProgress, setColabUrl } from "@/lib/birdsense/api";
import { useScene } from "@/lib/birdsense/sceneStore";
import type { HistoryEntry } from "@/lib/birdsense/types";
import ConnectionPanel from "@/components/birdsense/ConnectionPanel";
import AudioUpload from "@/components/birdsense/AudioUpload";
import ProgressTracker from "@/components/birdsense/ProgressTracker";
import ResultsPanel from "@/components/birdsense/ResultsPanel";
import HistoryPanel from "@/components/birdsense/HistoryPanel";

export const Route = createFileRoute("/app")({
    head: () => ({
        meta: [
            { title: "Analyzer — BirdSense" },
            { name: "description", content: "Connect your Colab GPU and run the BirdSense ensemble on your audio." },
            { property: "og:title", content: "BirdSense Analyzer" },
            { property: "og:description", content: "Live ensemble inference on bird audio." },
        ],
    }),
    component: AppPage,
});

function SectionCard({
    step, title, children, delay = 0,
}: {
    step: string; title: string; children: React.ReactNode; delay?: number;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass"
            style={{ padding: "28px 32px" }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(30,215,96,0.2), rgba(30,215,96,0.06))",
                    border: "1px solid rgba(30,215,96,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ".7rem", fontFamily: "var(--font-display)", fontWeight: 900,
                    color: "var(--accent)",
                }}>
                    {step}
                </div>
                <h2 className="font-display" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    {title}
                </h2>
            </div>
            {children}
        </motion.section>
    );
}

function AppPage() {
    const {
        connected, audioFile,
        nSources, geoEnabled, lat, lon, week,
        setNSources, setGeoEnabled, setLat, setLon, setWeek,
        analyzing, setAnalyzing, setRunId, applyProgress,
        setResult, setError, addHistory, error, colabUrl,
    } = useStore();

    // Restore url from store into api module
    useEffect(() => { if (colabUrl) setColabUrl(colabUrl); }, [colabUrl]);

    // Sync analyzing -> scene
    useEffect(() => { useScene.getState().setAnalyzing(analyzing); }, [analyzing]);

    const canRun = connected && !!audioFile && !analyzing;

    const runAnalysis = useCallback(async () => {
        if (!audioFile || !connected) return;
        setAnalyzing(true); setError(null); setResult(null);
        try {
            const { run_id } = await submitAnalysis({
                file: audioFile, nSources,
                lat: geoEnabled ? lat : undefined,
                lon: geoEnabled ? lon : undefined,
                week,
            });
            setRunId(run_id);
            await new Promise<void>((resolve, reject) => {
                const cleanup = streamProgress(
                    run_id,
                    (evt) => applyProgress(evt),
                    (res) => {
                        setResult(res);
                        const entry: HistoryEntry = {
                            id: res.run_id, filename: res.file,
                            timestamp: new Date().toISOString(),
                            predictions: res.predictions, elapsed_seconds: res.elapsed_seconds,
                        };
                        addHistory(entry); resolve();
                    },
                    (err) => { setError(err); reject(new Error(err)); },
                );
                setTimeout(cleanup, 320_000);
            });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setAnalyzing(false);
        }
    }, [audioFile, connected, nSources, geoEnabled, lat, lon, week,
        setAnalyzing, setError, setResult, setRunId, applyProgress, addHistory]);

    const sliderPct = (v: number, min: number, max: number) => `${((v - min) / (max - min)) * 100}%`;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "106px 24px 80px" }}>

            {/* ── Page header ── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
                <div className="pill pill-accent" style={{ marginBottom: 18 }}>
                    <span style={{ fontSize: ".9rem" }}>🛰️</span>
                    Bioacoustic Analyzer
                </div>
                <h1 className="font-display" style={{ fontWeight: 900, fontSize: "clamp(2rem, 4.5vw, 3rem)", marginBottom: 10 }}>
                    The <span className="gradient-text">Analyzer</span>
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 560, lineHeight: 1.7 }}>
                    Connect your Colab tunnel, upload audio, and run the BirdNET + YAMNet + Perch ensemble.
                </p>
            </motion.div>

            {/* ── Connection ── */}
            <SectionCard step="①" title="Connect to Colab GPU" delay={0.04}>
                <ConnectionPanel />
            </SectionCard>

            {/* ── Upload + Settings side-by-side ── */}
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", marginTop: 20, marginBottom: 20 }}>
                <SectionCard step="②" title="Upload audio" delay={0.08}>
                    <AudioUpload />
                </SectionCard>

                <SectionCard step="③" title="Settings" delay={0.12}>
                    {/* NMF sources */}
                    <label style={{ display: "block", marginBottom: 22 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: ".83rem", color: "var(--text-muted)", fontWeight: 500 }}>NMF sources</span>
                            <span style={{
                                fontSize: ".82rem", color: "var(--accent)", fontWeight: 800,
                                background: "rgba(30,215,96,0.1)", padding: "2px 10px",
                                borderRadius: 8, border: "1px solid rgba(30,215,96,0.2)",
                            }}>{nSources}</span>
                        </div>
                        <input
                            type="range" min={1} max={4} value={nSources}
                            onChange={(e) => setNSources(Number(e.target.value))}
                            className="slider"
                            style={{ ["--val" as string]: sliderPct(nSources, 1, 4) } as React.CSSProperties}
                        />
                    </label>

                    {/* Week */}
                    <label style={{ display: "block", marginBottom: 22 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: ".83rem", color: "var(--text-muted)", fontWeight: 500 }}>Week of year</span>
                            <span style={{
                                fontSize: ".82rem", color: "var(--accent)", fontWeight: 800,
                                background: "rgba(30,215,96,0.1)", padding: "2px 10px",
                                borderRadius: 8, border: "1px solid rgba(30,215,96,0.2)",
                            }}>
                                {week === -1 ? "All" : week}
                            </span>
                        </div>
                        <input
                            type="range" min={-1} max={48} value={week}
                            onChange={(e) => setWeek(Number(e.target.value))}
                            className="slider"
                            style={{ ["--val" as string]: sliderPct(week, -1, 48) } as React.CSSProperties}
                        />
                    </label>

                    <div className="divider" style={{ margin: "16px 0" }} />

                    {/* Geographic filter */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: geoEnabled ? 14 : 0 }}>
                        <div>
                            <span style={{ fontSize: ".88rem", fontWeight: 500 }}>Geographic filter</span>
                            <p style={{ color: "var(--text-muted)", fontSize: ".75rem", marginTop: 2 }}>
                                Narrow by lat/lon
                            </p>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={geoEnabled} onChange={(e) => setGeoEnabled(e.target.checked)} />
                            <span className="toggle-track" />
                            <span className="toggle-thumb" />
                        </label>
                    </div>

                    {geoEnabled && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}
                        >
                            <input className="input" type="number" step="0.01" value={lat}
                                onChange={(e) => setLat(Number(e.target.value))} placeholder="Latitude" />
                            <input className="input" type="number" step="0.01" value={lon}
                                onChange={(e) => setLon(Number(e.target.value))} placeholder="Longitude" />
                        </motion.div>
                    )}
                </SectionCard>
            </div>

            {/* ── Run button ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.16 }}
                style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}
            >
                <button
                    className="btn btn-primary btn-lg"
                    disabled={!canRun}
                    onClick={runAnalysis}
                    style={{ minWidth: 220 }}
                    id="run-analysis-btn"
                >
                    {analyzing
                        ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Analyzing…</>
                        : <>🐦 Run analysis</>
                    }
                </button>
            </motion.div>

            {/* ── Readiness hints ── */}
            {!connected && !analyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: "center", color: "var(--text-muted)", fontSize: ".83rem", marginBottom: 24 }}
                >
                    Connect to Colab GPU first to enable analysis
                </motion.div>
            )}

            {/* ── Error ── */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="glass"
                    style={{
                        padding: "16px 20px", marginBottom: 24,
                        borderColor: "rgba(248,113,113,0.45)",
                        background: "rgba(248,113,113,0.06)",
                        display: "flex", alignItems: "flex-start", gap: 12,
                    }}
                >
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
                    <p style={{ color: "var(--danger)", fontSize: ".9rem", lineHeight: 1.6 }}>{error}</p>
                </motion.div>
            )}

            <ProgressTracker />
            <ResultsPanel />
            <HistoryPanel />
        </div>
    );
}

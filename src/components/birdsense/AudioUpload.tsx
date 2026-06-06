import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/birdsense/store";
import WaveformVisualizer from "./WaveformVisualizer";

const ACCEPTED = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/flac", "audio/ogg", "audio/x-flac"];
const MAX_MB = 50;

export default function AudioUpload() {
    const { setAudioFile } = useStore();
    const [over, setOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileMeta, setFileMeta] = useState<string | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        setError(null);
        if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg)$/i)) {
            setError("Unsupported format. Please upload WAV, MP3, FLAC or OGG.");
            return;
        }
        const mb = file.size / 1024 / 1024;
        if (mb > MAX_MB) { setError(`File too large (${mb.toFixed(1)} MB). Max ${MAX_MB} MB.`); return; }

        const url = URL.createObjectURL(file);
        setAudioFile(file, url);
        setFileName(file.name);
        setFileMeta(`${mb.toFixed(2)} MB · ${file.type || "audio"}`);

        try {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new Ctx();
            const buf = await file.arrayBuffer();
            const decoded = await ctx.decodeAudioData(buf);
            setAudioBuffer(decoded);
            setFileMeta(`${mb.toFixed(2)} MB · ${decoded.duration.toFixed(1)}s · ${decoded.sampleRate.toLocaleString()} Hz`);
        } catch { /* waveform optional */ }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const onClear = () => {
        setAudioFile(null, null);
        setFileName(null); setFileMeta(null); setAudioBuffer(null); setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const formats = ["WAV", "MP3", "FLAC", "OGG"];

    return (
        <div>
            <AnimatePresence mode="wait">
                {!fileName ? (
                    <motion.div
                        key="drop"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className={`drop-zone${over ? " over" : ""}`}
                        onDrop={onDrop}
                        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                        onDragLeave={() => setOver(false)}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                        tabIndex={0} role="button" aria-label="Upload audio file"
                    >
                        <motion.div animate={over ? { scale: 1.1 } : { scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 20 }}>
                            {/* Animated icon */}
                            <div style={{
                                width: 64, height: 64, borderRadius: 18,
                                background: over ? "rgba(30,215,96,0.12)" : "rgba(255,255,255,0.04)",
                                border: `2px solid ${over ? "rgba(30,215,96,0.5)" : "var(--border-subtle)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.9rem", margin: "0 auto 16px",
                                transition: "background .25s, border-color .25s",
                                boxShadow: over ? "0 0 24px rgba(30,215,96,0.2)" : "none",
                            }}>
                                {over ? "🎵" : "🎧"}
                            </div>

                            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 6 }}>
                                {over ? "Drop to upload!" : "Drop your audio here"}
                            </p>
                            <p style={{ color: "var(--text-muted)", fontSize: ".85rem", marginBottom: 14 }}>
                                or{" "}
                                <span style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline", textDecorationStyle: "dotted" }}>
                                    browse files
                                </span>
                            </p>

                            {/* Format pills */}
                            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                {formats.map((fmt) => (
                                    <span key={fmt} style={{
                                        fontSize: ".7rem", padding: "2px 9px", borderRadius: 6, fontWeight: 600,
                                        background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)",
                                        color: "var(--text-muted)",
                                    }}>{fmt}</span>
                                ))}
                                <span style={{
                                    fontSize: ".7rem", padding: "2px 9px", borderRadius: 6, fontWeight: 600,
                                    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)",
                                    color: "var(--text-subtle)",
                                }}>Max {MAX_MB} MB</span>
                            </div>
                        </motion.div>
                        <input
                            ref={inputRef} type="file" hidden
                            accept=".wav,.mp3,.flac,.ogg"
                            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        {/* File info header */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
                            padding: "12px 16px",
                            background: "rgba(30,215,96,0.05)",
                            border: "1px solid rgba(30,215,96,0.2)",
                            borderRadius: 14,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                background: "rgba(30,215,96,0.12)", border: "1px solid rgba(30,215,96,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                            }}>🎧</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: ".9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {fileName}
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: ".75rem", marginTop: 2 }}>{fileMeta}</p>
                            </div>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={onClear}
                                title="Remove file"
                                style={{ flexShrink: 0, color: "var(--danger)", borderColor: "rgba(248,113,113,0.2)" }}
                            >
                                ✕
                            </button>
                        </div>
                        {/* Waveform */}
                        {audioBuffer && (
                            <div style={{
                                borderRadius: 12, overflow: "hidden",
                                border: "1px solid var(--border-subtle)",
                                background: "rgba(0,0,0,0.2)",
                            }}>
                                <WaveformVisualizer audioBuffer={audioBuffer} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            color: "var(--danger)", fontSize: ".82rem", marginTop: 10,
                            background: "rgba(248,113,113,0.07)",
                            border: "1px solid rgba(248,113,113,0.25)",
                            borderRadius: 10, padding: "8px 12px",
                        }}
                    >
                        <span>⚠️</span> {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/birdsense/store";
import { checkHealth, setColabUrl } from "@/lib/birdsense/api";

export default function ConnectionPanel() {
    const { colabUrl, health, connected, setColabUrl: storeSetUrl, setHealth, setConnected } = useStore();
    const [urlInput, setUrlInput] = useState(colabUrl);
    const [checking, setChecking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const doConnect = useCallback(async (url: string) => {
        if (!url.trim()) return;
        const normalized = url.trim().replace(/\/$/, "");
        setChecking(true); setErrorMsg(null);
        setColabUrl(normalized);
        storeSetUrl(normalized);
        try {
            const h = await checkHealth();
            setHealth(h); setConnected(true); setErrorMsg(null);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            setHealth(null); setConnected(false); setErrorMsg(msg);
        } finally { setChecking(false); }
    }, [storeSetUrl, setHealth, setConnected]);

    const models = health?.models_loaded;
    const gpuName = health?.gpu_devices?.[0]?.replace("/physical_device:GPU:", "GPU ") ?? "GPU";

    return (
        <div>
            {/* URL input row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <span style={{
                        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                        fontSize: ".95rem", pointerEvents: "none", zIndex: 1,
                    }}>🌐</span>
                    <input
                        className="input" style={{ paddingLeft: 40 }} type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && doConnect(urlInput)}
                        placeholder="https://xxxx.ngrok-free.app  or  https://xxxx.loca.lt"
                        spellCheck={false} autoComplete="off"
                    />
                </div>
                <button
                    className="btn btn-primary btn-sm"
                    disabled={checking || !urlInput.trim()}
                    onClick={() => doConnect(urlInput)}
                    style={{ minWidth: 90, fontSize: ".85rem", padding: "0 18px" }}
                >
                    {checking ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Connect"}
                </button>
            </div>

            {/* Status banner */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`connection-status ${connected ? "connected" : errorMsg ? "error" : "idle"}`}
            >
                <span className={`status-dot ${connected ? "status-dot-ok" : errorMsg ? "status-dot-error" : "status-dot-idle"}`} />
                <span style={{ color: connected ? "var(--success)" : errorMsg ? "var(--danger)" : "var(--text-muted)", fontSize: ".85rem" }}>
                    {checking ? "Pinging Colab backend…"
                        : connected ? `Connected · ${gpuName}`
                            : errorMsg ? `Cannot reach Colab: ${errorMsg}`
                                : "Enter your Colab tunnel URL to connect to the GPU backend"}
                </span>
                {connected && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => doConnect(urlInput)}
                        disabled={checking}
                        style={{ marginLeft: "auto", fontSize: ".75rem" }}
                    >
                        🔄 Re-check
                    </button>
                )}
            </motion.div>

            {/* Model status badges */}
            <AnimatePresence>
                {connected && models && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}
                    >
                        {[
                            { key: "BirdNET", icon: "🐦", loaded: models.BirdNET },
                            { key: "YAMNet", icon: "🎵", loaded: models.YAMNet },
                            { key: "Perch", icon: "🔬", loaded: models.Perch },
                        ].map(({ key, icon, loaded }) => (
                            <div key={key} className={`model-badge ${loaded ? "loaded" : "pending"}`}>
                                <span>{icon}</span>
                                <span>{key}</span>
                                <span style={{ fontSize: ".75rem" }}>{loaded ? "✅" : "⏳"}</span>
                            </div>
                        ))}
                        <div className="model-badge loaded">
                            <span>⚡</span>
                            <span>{gpuName}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

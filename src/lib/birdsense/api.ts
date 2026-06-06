import type { ColabHealth, AnalysisResult, WikiInfo, ProgressEvent } from "./types";

let _colabUrl = "";

export function setColabUrl(url: string) { _colabUrl = url.replace(/\/$/, ""); }
export function getColabUrl() { return _colabUrl; }

export async function checkHealth(): Promise<ColabHealth> {
    const res = await fetch(`${_colabUrl}/health`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export interface AnalyzeOptions {
    file: File; nSources: number; lat?: number; lon?: number; week: number;
}

export async function submitAnalysis(opts: AnalyzeOptions): Promise<{ run_id: string }> {
    const form = new FormData();
    form.append("file", opts.file);
    form.append("n_sources", String(opts.nSources));
    form.append("week", String(opts.week));
    if (opts.lat !== undefined) form.append("lat", String(opts.lat));
    if (opts.lon !== undefined) form.append("lon", String(opts.lon));

    const res = await fetch(`${_colabUrl}/analyze`, {
        method: "POST", body: form, signal: AbortSignal.timeout(300_000),
    });
    if (res.status === 413) throw new Error("File too large (max 50 MB)");
    if (!res.ok) {
        const body = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error((body as { detail?: string }).detail || `HTTP ${res.status}`);
    }
    return res.json();
}

export function streamProgress(
    runId: string,
    onEvent: (e: ProgressEvent) => void,
    onDone: (result: AnalysisResult) => void,
    onError: (err: string) => void,
): () => void {
    const es = new EventSource(`${_colabUrl}/stream/${runId}`);
    es.addEventListener("progress", (e) => {
        try { onEvent(JSON.parse((e as MessageEvent).data)); } catch { /* noop */ }
    });
    es.addEventListener("result", (e) => {
        try {
            const result: AnalysisResult = JSON.parse((e as MessageEvent).data);
            onDone(result); es.close();
        } catch { onError("Invalid result payload"); }
    });
    es.addEventListener("error_event", (e) => {
        onError((e as MessageEvent).data || "Unknown server error"); es.close();
    });
    es.onerror = () => { onError("Connection to Colab lost. Check your URL and retry."); es.close(); };
    return () => es.close();
}

const wikiCache = new Map<string, WikiInfo>();
export async function fetchWiki(species: string): Promise<WikiInfo | null> {
    if (wikiCache.has(species)) return wikiCache.get(species)!;
    try {
        const res = await fetch(`${_colabUrl}/wiki/${encodeURIComponent(species)}`, {
            signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        wikiCache.set(species, data);
        return data;
    } catch { return null; }
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    ColabHealth, AnalysisResult, HistoryEntry, ProgressEvent, PipelineStage,
} from "./types";

interface AppState {
    colabUrl: string;
    health: ColabHealth | null;
    connected: boolean;
    setColabUrl: (url: string) => void;
    setHealth: (h: ColabHealth | null) => void;
    setConnected: (v: boolean) => void;

    audioFile: File | null;
    audioUrl: string | null;
    setAudioFile: (f: File | null, url: string | null) => void;

    nSources: number;
    geoEnabled: boolean;
    lat: number;
    lon: number;
    week: number;
    setNSources: (n: number) => void;
    setGeoEnabled: (v: boolean) => void;
    setLat: (v: number) => void;
    setLon: (v: number) => void;
    setWeek: (v: number) => void;

    analyzing: boolean;
    runId: string | null;
    currentStage: PipelineStage | null;
    progressPct: number;
    progressMsg: string;
    elapsedMs: number;
    result: AnalysisResult | null;
    error: string | null;
    setAnalyzing: (v: boolean) => void;
    setRunId: (id: string | null) => void;
    applyProgress: (e: ProgressEvent) => void;
    setResult: (r: AnalysisResult | null) => void;
    setError: (e: string | null) => void;
    resetAnalysis: () => void;

    history: HistoryEntry[];
    addHistory: (e: HistoryEntry) => void;
    clearHistory: () => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            colabUrl: import.meta.env.VITE_BACKEND_URL || "https://nikhil281205-birdsense-api.hf.space", health: null, connected: false,
            setColabUrl: (colabUrl) => set({ colabUrl }),
            setHealth: (health) => set({ health }),
            setConnected: (connected) => set({ connected }),

            audioFile: null, audioUrl: null,
            setAudioFile: (audioFile, audioUrl) => set({ audioFile, audioUrl }),

            nSources: 2, geoEnabled: false, lat: 20.59, lon: 78.96, week: -1,
            setNSources: (nSources) => set({ nSources }),
            setGeoEnabled: (geoEnabled) => set({ geoEnabled }),
            setLat: (lat) => set({ lat }),
            setLon: (lon) => set({ lon }),
            setWeek: (week) => set({ week }),

            analyzing: false, runId: null, currentStage: null,
            progressPct: 0, progressMsg: "", elapsedMs: 0, result: null, error: null,
            setAnalyzing: (analyzing) => set({ analyzing }),
            setRunId: (runId) => set({ runId }),
            applyProgress: (e) => set({ currentStage: e.stage, progressPct: e.pct, progressMsg: e.message }),
            setResult: (result) => set({ result }),
            setError: (error) => set({ error }),
            resetAnalysis: () => set({
                analyzing: false, runId: null, currentStage: null,
                progressPct: 0, progressMsg: "", elapsedMs: 0, result: null, error: null,
            }),

            history: [],
            addHistory: (e) => set((s) => ({ history: [e, ...s.history].slice(0, 20) })),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "birdsense-store",
            partialize: (s) => ({ history: s.history, colabUrl: s.colabUrl }),
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (persistedState && typeof persistedState === "object" && persistedState.colabUrl) {
                    if (persistedState.colabUrl.includes("modal.run")) {
                        persistedState.colabUrl = "https://nikhil281205-birdsense-api.hf.space";
                    }
                }
                return persistedState;
            },
        },
    ),
);

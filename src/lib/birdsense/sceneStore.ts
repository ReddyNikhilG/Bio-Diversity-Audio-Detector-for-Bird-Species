import { create } from "zustand";

export type SceneMode = "landing" | "app" | "about";

interface SceneState {
    mode: SceneMode;
    scrollProgress: number;     // 0..1 across landing
    analyzing: boolean;
    setMode: (m: SceneMode) => void;
    setScroll: (p: number) => void;
    setAnalyzing: (v: boolean) => void;
}

export const useScene = create<SceneState>((set) => ({
    mode: "landing",
    scrollProgress: 0,
    analyzing: false,
    setMode: (mode) => set({ mode }),
    setScroll: (scrollProgress) => set({ scrollProgress }),
    setAnalyzing: (analyzing) => set({ analyzing }),
}));

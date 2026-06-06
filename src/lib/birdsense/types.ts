export interface ColabHealth {
    status: string;
    gpu_devices: string[];
    models_loaded: { BirdNET: boolean; YAMNet: boolean; Perch: boolean };
    timestamp: string;
}

export interface Prediction {
    species: string;
    common_name: string;
    confidence: number;
    temporal_score?: number;
    timestamps?: Array<{ start: number; end: number; conf: number }>;
}

export interface AnalysisResult {
    success: boolean;
    run_id: string;
    elapsed_seconds: number;
    file: string;
    predictions: Prediction[];
    snr_db?: number;
    quality_score?: number;
    raw_data: Record<string, unknown>[];
}

export interface WikiInfo {
    title: string;
    summary: string;
    url: string;
    image_url: string | null;
    common_name: string;
    conservation_status?: string;
}

export type PipelineStage =
    | "upload" | "preprocess" | "separation"
    | "birdnet" | "yamnet" | "perch"
    | "voting" | "complete" | "error";

export interface ProgressEvent { stage: PipelineStage; message: string; pct: number }

export interface HistoryEntry {
    id: string;
    filename: string;
    timestamp: string;
    predictions: Prediction[];
    elapsed_seconds: number;
}

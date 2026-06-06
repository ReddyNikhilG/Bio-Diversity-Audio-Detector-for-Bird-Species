# backend/api.py
# ============================================================
# BirdSense — Cloud GPU FastAPI Backend
# Works with: Modal.com (recommended), any Docker host with GPU
#
# Endpoints:
#   GET  /health            — GPU + model status
#   POST /analyze           — Submit audio, returns run_id
#   GET  /stream/{run_id}   — SSE live pipeline progress
#   GET  /results/{run_id}  — Polling fallback for results
#   GET  /wiki/{species}    — Wikipedia species info (cached)
#   GET  /docs              — Interactive API docs
# ============================================================

import os
import uuid
import json
import time
import shutil
import asyncio
import threading
import queue
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

# Force TensorFlow initialization on the main thread for correct GPU detection
try:
    import tensorflow as tf
    print("[MAIN_THREAD] TensorFlow loaded. GPUs available:", tf.config.list_physical_devices("GPU"))
except Exception as e:
    print("[MAIN_THREAD] TensorFlow import failed:", e)

# ── Module-level state ────────────────────────────────────────
eval_prebuilt = None
_progress_queues: Dict[str, queue.Queue] = {}
_results_store:   Dict[str, Any]         = {}
_wiki_cache:      Dict[str, Any]         = {}

MAX_FILE_MB = 50
RUNS_DIR    = "/tmp/birdsense_runs"
os.makedirs(RUNS_DIR, exist_ok=True)


# ── Startup: pre-warm all GPU models ─────────────────────────
@asynccontextmanager
async def lifespan(application: FastAPI):
    global eval_prebuilt

    print("=" * 60)
    print("[STARTUP] BirdSense GPU Backend starting…")
    print("[STARTUP] Pre-loading BirdNET + YAMNet + Perch models…")
    print("=" * 60)

    import importlib
    eval_prebuilt = importlib.import_module("eval_prebuilt")

    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, eval_prebuilt.load_models_once)
        print("[STARTUP] ✅ All models loaded.")
    except Exception as e:
        print(f"[STARTUP] ⚠️  Model pre-load error: {e}")
        print("[STARTUP] Models will load on first request instead.")

    print("[STARTUP] 🐦 BirdSense API is ready.")
    yield
    print("[SHUTDOWN] BirdSense API shutting down.")


# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title="BirdSense AI — GPU Backend",
    description="BirdNET (60%) + YAMNet (25%) + Google Perch (15%) ensemble",
    version="4.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow all origins — frontend can be on any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Root ──────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service":  "BirdSense AI Backend",
        "version":  "4.0.0",
        "status":   "running",
        "docs":     "/docs",
        "endpoints": {
            "health":  "GET  /health",
            "analyze": "POST /analyze",
            "stream":  "GET  /stream/{run_id}",
            "results": "GET  /results/{run_id}",
            "wiki":    "GET  /wiki/{species_name}",
        },
    }


# ── Health ────────────────────────────────────────────────────
@app.get("/health")
def health():
    """GPU + model status — polled by the frontend on connect."""
    gpu_devices = []
    smi_output = ""
    try:
        import subprocess
        smi_output = subprocess.check_output(["nvidia-smi"]).decode("utf-8")
    except Exception as e:
        smi_output = f"Failed to run nvidia-smi: {e}"

    try:
        import tensorflow as tf
        gpus = tf.config.list_physical_devices("GPU")
        gpu_devices = (
            [d.name.replace("/physical_device:", "") for d in gpus]
            if gpus else ["CPU only — no GPU on this instance"]
        )
    except Exception as e:
        gpu_devices = [f"TensorFlow error: {e}"]

    models = {"BirdNET": False, "YAMNet": False, "Perch": False}
    if eval_prebuilt:
        models = {
            "BirdNET": eval_prebuilt._cached_analyzer     is not None,
            "YAMNet":  eval_prebuilt._cached_yamnet_model is not None,
            "Perch":   eval_prebuilt._cached_perch_model  is not None,
        }

    return {
        "status":        "ok",
        "gpu_devices":   gpu_devices,
        "nvidia_smi":    smi_output,
        "models_loaded": models,
        "timestamp":     time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


# ── Wikipedia proxy ───────────────────────────────────────────
@app.get("/wiki/{species_name:path}")
def wiki_proxy(species_name: str):
    """Proxies Wikipedia with in-memory cache. Avoids browser CORS issues."""
    if species_name in _wiki_cache:
        return _wiki_cache[species_name]
    try:
        import requests as req
        headers = {"User-Agent": "BirdSenseAPI/1.0 (contact: nikhil281205@gmail.com)"}
        search = req.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "list": "search",
                    "srsearch": f"{species_name} bird",
                    "format": "json", "srlimit": 1},
            headers=headers,
            timeout=10,
        ).json().get("query", {}).get("search", [])
        if not search:
            return JSONResponse({"error": "not_found"}, status_code=404)

        title = search[0]["title"]
        data  = req.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
            headers=headers,
            timeout=10,
        ).json()

        result = {
            "title":       data.get("title", title),
            "summary":     data.get("extract", "")[:600],
            "url":         data.get("content_urls", {}).get("desktop", {})
                               .get("page", f"https://en.wikipedia.org/wiki/{title}"),
            "image_url":   data.get("thumbnail", {}).get("source"),
            "common_name": data.get("displaytitle", title),
        }
        _wiki_cache[species_name] = result
        return result
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── SSE live progress stream ──────────────────────────────────
@app.get("/stream/{run_id}")
async def stream_progress(run_id: str):
    """Connect here after POST /analyze to get live pipeline stage updates."""
    if run_id not in _progress_queues:
        raise HTTPException(404, f"Run '{run_id}' not found. Call POST /analyze first.")

    async def event_generator():
        q     = _progress_queues[run_id]
        start = time.time()
        while time.time() - start < 360:
            try:
                event = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: q.get(timeout=2)
                )
                yield f"event: {event.get('type', 'progress')}\ndata: {json.dumps(event)}\n\n"
                if event.get("type") in ("result", "error_event"):
                    break
            except queue.Empty:
                yield ": keepalive\n\n"
        _progress_queues.pop(run_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Polling fallback ──────────────────────────────────────────
@app.get("/results/{run_id}")
async def get_results(run_id: str):
    """Returns 202 (pending) or 200 (done). Fallback if SSE is unavailable."""
    if run_id not in _results_store:
        if run_id in _progress_queues:
            return JSONResponse({"status": "pending"}, status_code=202)
        raise HTTPException(404, "Run ID not found.")
    return _results_store[run_id]


# ── Main analysis endpoint ────────────────────────────────────
@app.post("/analyze")
async def analyze(
    file:      UploadFile      = File(...),
    n_sources: int             = Form(2),
    lat:       Optional[float] = Form(None),
    lon:       Optional[float] = Form(None),
    week:      int             = Form(-1),
):
    """
    Submit an audio file for GPU analysis.
    Returns run_id immediately. Connect to /stream/{run_id} for live progress.

    Pipeline:
      1. Validate + save audio
      2. NMF source separation
      3. BirdNET inference (60% weight)
      4. YAMNet noise validation (25%)
      5. Google Perch peer review (15%)
      6. Weighted ensemble + temporal voting
      7. Return ranked species list with timestamps
    """
    t_start = time.time()

    # Validate
    contents = await file.read()
    size_mb  = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        raise HTTPException(413, f"File too large ({size_mb:.1f} MB). Max {MAX_FILE_MB} MB.")
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in {".wav", ".mp3", ".flac", ".ogg"}:
        raise HTTPException(400, f"Unsupported format '{ext}'. Use WAV, MP3, FLAC or OGG.")

    # Create isolated run directory
    run_id   = str(uuid.uuid4())
    run_dir  = os.path.join(RUNS_DIR, f"run_{run_id}")
    os.makedirs(run_dir, exist_ok=True)
    safe_name = os.path.basename(file.filename or "audio_upload.wav")
    with open(os.path.join(run_dir, safe_name), "wb") as f:
        f.write(contents)

    print(f"[ANALYZE] {run_id[:8]}  file={safe_name}  {size_mb:.1f}MB  n_sources={n_sources}")

    # Register SSE queue
    q: queue.Queue = queue.Queue()
    _progress_queues[run_id] = q

    def emit(stage: str, msg: str, pct: int):
        q.put({"stage": stage, "message": msg, "pct": pct})

    # Run pipeline in background thread
    def pipeline_thread():
        try:
            emit("upload", "Audio received — starting pipeline…", 8)

            from main import run_pipeline
            run_pipeline(
                n_sources=n_sources, lat=lat, lon=lon, week=week,
                run_id=run_id, run_dir=run_dir, progress_callback=emit,
            )

            import pandas as pd
            csv_path = os.path.join(run_dir, "results.csv")
            if not os.path.exists(csv_path):
                raise RuntimeError("Pipeline produced no results.csv. Check audio quality.")

            df     = pd.read_csv(csv_path)
            df_run = df[df["Run_ID"] == run_id] if "Run_ID" in df.columns else df
            if len(df_run) == 0:
                raise RuntimeError("0 predictions returned. Try cleaner audio or fewer NMF sources.")

            # Parse + deduplicate predictions
            predictions = []
            for _, row in df_run.iterrows():
                try:
                    predictions.extend(json.loads(row.get("Top_Predictions_JSON", "[]")))
                except Exception:
                    predictions.append({
                        "species":    row.get("Top_Predicted_Species", "Unknown"),
                        "confidence": float(row.get("Top_Prediction_Confidence", 0.0)),
                    })

            seen: Dict[str, dict] = {}
            for p in predictions:
                sp = p.get("species", "")
                if sp not in seen or p.get("confidence", 0) > seen[sp].get("confidence", 0):
                    seen[sp] = p

            sorted_preds = sorted(seen.values(), key=lambda x: x.get("confidence", 0), reverse=True)
            elapsed      = round(time.time() - t_start, 2)

            result = {
                "type": "result", "success": True,
                "run_id": run_id, "elapsed_seconds": elapsed,
                "file": safe_name, "predictions": sorted_preds,
                "raw_data": df_run.fillna("").to_dict(orient="records"),
                "data":     df_run.fillna("").to_dict(orient="records"),
            }
            _results_store[run_id] = result
            emit("complete", f"✅ Done in {elapsed}s", 100)
            q.put({**result, "type": "result"})
            print(f"[DONE] {run_id[:8]}  {elapsed}s  {len(sorted_preds)} species")

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print(f"[ERROR] {run_id[:8]}\n{tb}")
            q.put({"type": "error_event", "message": str(e), "detail": tb[-1000:]})

        finally:
            def cleanup():
                time.sleep(60)
                shutil.rmtree(run_dir, ignore_errors=True)
            threading.Thread(target=cleanup, daemon=True).start()

    threading.Thread(target=pipeline_thread, daemon=True).start()

    return {
        "run_id":  run_id,
        "stream":  f"/stream/{run_id}",
        "poll":    f"/results/{run_id}",
        "message": "Analysis started.",
    }

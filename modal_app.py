# modal_app.py
# ============================================================
# BirdSense — Modal.com Serverless GPU Backend
#
# HOW TO DEPLOY (3 commands):
#   pip install modal
#   modal token new
#   modal deploy modal_app.py
#
# After deploy you get a permanent URL like:
#   https://YOUR_NAME--birdsense-api.modal.run
#
# COST: Free — $30 GPU credit every month (resets monthly)
#       Only billed while a request is processing. Idle = $0
# ============================================================

import modal
import os

# ── 1. Define the container image ────────────────────────────
# This is what gets installed inside Modal's cloud server
image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04",
        add_python="3.10",
    )
    .apt_install(
        "libsndfile1",   # audio file reading
        "ffmpeg",        # audio format conversion
        "build-essential",
    )
    .pip_install(
        # API server
        "fastapi>=0.110.0",
        "uvicorn[standard]>=0.27.0",
        "python-multipart>=0.0.9",
        "aiofiles>=24.0.0",
        # Audio processing
        "librosa>=0.10.0",
        "soundfile>=0.12.1",
        "scipy>=1.11.0",
        "numpy>=1.24.0,<2.0.0",
        "noisereduce>=3.0.0",
        "resampy",
        # ML
        "scikit-learn>=1.3.0",
        "tqdm>=4.66.0",
        "birdnetlib>=0.9.0",
        "tensorflow[and-cuda]>=2.15.0",
        "tensorflow-hub>=0.16.0",
        "pandas>=2.0.0",
        "requests>=2.31.0",
    )
    .env({
        "TFHUB_CACHE_DIR": "/tfhub_cache",
        "TF_CPP_MIN_LOG_LEVEL": "2",
    })
    # Copy the entire project into the container, ignoring large folders
    .add_local_dir(".", remote_path="/app_code", ignore=[".venv", "node_modules", ".git", ".lovable", "__pycache__"])
)

# ── 2. Define the Modal app ───────────────────────────────────
app = modal.App(name="birdsense-api", image=image)

# ── 3. Persistent volume to cache downloaded ML models ───────
# TF Hub downloads BirdNET/YAMNet/Perch on first run (~500MB).
# This volume saves them so subsequent boots are instant.
model_volume = modal.Volume.from_name(
    "birdsense-models", create_if_missing=True
)

# ── 4. The FastAPI web endpoint ───────────────────────────────
@app.function(
    gpu="T4",                                           # Free T4 GPU
    memory=16384,                                       # 16 GB RAM
    timeout=360,                                        # 6-minute max per request
    min_containers=1,                                   # 1 warm container = no cold start
    volumes={"/tfhub_cache": model_volume},             # Persist downloaded TF Hub models
)
@modal.concurrent(max_inputs=4)                         # Handle 4 simultaneous requests
@modal.asgi_app()
def serve():
    """Entry point — returns the BirdSense FastAPI app."""
    import sys
    sys.path.insert(0, "/app_code")
    # backend/api.py is the FastAPI app
    # main.py, eval_prebuilt.py, preprocess/, utils/ are at /app_code root
    from backend.api import app as fastapi_app
    return fastapi_app

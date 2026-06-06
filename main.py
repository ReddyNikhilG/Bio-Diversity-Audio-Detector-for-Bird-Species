# main.py
# ============================================================
# Runs ONLY on Google Colab GPU backend.
# Exposes run_pipeline() which is called by colab_api.py.
# All heavy imports are deferred — safe to import on any machine.
# ============================================================

import argparse
import os


def run_pipeline(
    n_sources=2,
    lat=None,
    lon=None,
    week=-1,
    run_id="none",
    run_dir=None,
    progress_callback=None,
):
    """
    Full GPU pipeline:
      Phase 1 — Audio preprocessing + NMF source separation
      Phase 2 — BirdNET + YAMNet + Perch weighted ensemble inference

    Args:
        n_sources:         Number of NMF stems to separate
        lat, lon:          Geographic filter (optional)
        week:              Week of year filter (-1 = all)
        run_id:            UUID for this analysis run
        run_dir:           Isolated temp directory for this run
        progress_callback: fn(stage, message, pct) for SSE events
    """
    from preprocess.dataset_builder import DatasetBuilder
    from eval_prebuilt import main as eval_main

    def emit(stage: str, msg: str, pct: int):
        print(f"[{pct:>3}%] [{stage}] {msg}")
        if progress_callback:
            progress_callback(stage, msg, pct)

    # Determine directories
    if run_dir:
        input_dir  = os.path.join(run_dir, "input")
        output_dir = os.path.join(run_dir, "processed")
        results_dir = run_dir
        # Move uploaded file into a species subfolder for the builder
        upload_dir = os.path.join(input_dir, "Unknown_Bird")
        os.makedirs(upload_dir, exist_ok=True)
        # Files should already be in run_dir root — move them
        import shutil
        for f in os.listdir(run_dir):
            fp = os.path.join(run_dir, f)
            if os.path.isfile(fp) and f.lower().endswith(('.wav','.mp3','.flac','.ogg')):
                shutil.move(fp, os.path.join(upload_dir, f))
    else:
        input_dir  = "input"
        output_dir = "processed"
        results_dir = "."

    emit("preprocess", "Starting audio preprocessing & denoising…", 15)

    # Phase 1: NMF separation
    builder = DatasetBuilder(n_sources=n_sources)
    builder.build(input_dir, output_dir)

    emit("separation", f"NMF separation complete ({n_sources} stems)", 40)
    emit("birdnet", "Running BirdNET inference (Lead Model)…", 55)

    # Phase 2: Ensemble inference
    eval_main(
        lat=lat,
        lon=lon,
        week=week,
        n_sources=n_sources,
        run_id=run_id,
        results_dir=results_dir,
        progress_callback=progress_callback,
    )


def main():
    parser = argparse.ArgumentParser(description="BirdSense — Colab GPU Pipeline")
    parser.add_argument("--n_sources", type=int,   default=2)
    parser.add_argument("--lat",       type=float, default=None)
    parser.add_argument("--lon",       type=float, default=None)
    parser.add_argument("--week",      type=int,   default=-1)
    parser.add_argument("--run_id",    type=str,   default="cli_run")
    args = parser.parse_args()

    run_pipeline(
        n_sources=args.n_sources,
        lat=args.lat,
        lon=args.lon,
        week=args.week,
        run_id=args.run_id,
    )


if __name__ == "__main__":
    main()
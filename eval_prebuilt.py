# eval_prebuilt.py
# ============================================================
# Runs ONLY on Google Colab GPU backend.
# Improved ensemble:
#   - Weighted voting (BirdNET 60% + YAMNet 25% + Perch 15%)
#   - Adaptive confidence threshold
#   - Common name lookup via BirdNET label list
#   - Detection timestamps (start/end)
#   - SSE progress callback
#   - Per-run results CSV (no global CSV collisions)
# ============================================================

import os
import json
import pandas as pd
from tqdm import tqdm

# ── Model cache globals ───────────────────────────────────────────────────────
_cached_analyzer      = None
_cached_yamnet_model  = None
_cached_yamnet_classes = []
_cached_perch_model   = None
_cached_perch_classes = []
_birdnet_labels: dict = {}       # scientific_name → common_name

import threading
_model_lock = threading.Lock()
COUNCIL_AVAILABLE = False

# ── Ensemble weights (calibrated) ─────────────────────────────────────────────
W_BIRDNET = 0.60
W_YAMNET  = 0.25
W_PERCH   = 0.15


def _load_birdnet_labels():
    """Build scientific→common name lookup from BirdNET's label files."""
    global _birdnet_labels
    try:
        from birdnetlib.analyzer import Analyzer
        # BirdNET Analyzer exposes its label path
        a_tmp = Analyzer()
        label_path = getattr(a_tmp, "classifier_labels_path", None)
        if label_path and os.path.exists(label_path):
            with open(label_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if "_" in line:
                        parts = line.split("_", 1)
                        sci, common = parts[0].strip(), parts[1].strip()
                        _birdnet_labels[sci.lower()] = common
    except Exception as e:
        print(f"[WARN] Could not load BirdNET label file: {e}")


def _load_perch_labels():
    """Build index → scientific_name lookup from Google Perch's label file."""
    global _cached_perch_classes
    if _cached_perch_classes:
        return
    try:
        import tensorflow_hub as hub
        import csv
        model_path = hub.resolve("https://tfhub.dev/google/bird-vocalization-classifier/4")
        labels_path = os.path.join(model_path, "assets", "label.csv")
        if os.path.exists(labels_path):
            classes = []
            with open(labels_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                rows = list(reader)
                if rows:
                    # Check if there is a header
                    start_idx = 0
                    first_row = rows[0]
                    if len(first_row) >= 2 and any(k in first_row[0].lower() or k in first_row[1].lower() for k in ("scientific", "ebird", "common", "label")):
                        start_idx = 1
                    
                    # Auto-detect column containing scientific name
                    sci_col = 0
                    if len(rows) > start_idx:
                        for row in rows[start_idx:min(start_idx + 10, len(rows))]:
                            if len(row) >= 2:
                                if " " in row[1] or "_" in row[1]:
                                    sci_col = 1
                                    break
                                elif " " in row[0] or "_" in row[0]:
                                    sci_col = 0
                                    break
                    
                    for i in range(start_idx, len(rows)):
                        row = rows[i]
                        if len(row) > sci_col:
                            sci_name = row[sci_col].strip().lower().replace("_", " ")
                            classes.append(sci_name)
                        elif len(row) > 0:
                            classes.append(row[0].strip().lower().replace("_", " "))
                        else:
                            classes.append("")
            _cached_perch_classes = classes
            print(f"Loaded {len(_cached_perch_classes)} Google Perch classes.")
        else:
            print("[WARN] Perch label.csv not found in assets.")
    except Exception as e:
        print(f"[WARN] Could not load Perch label file: {e}")


def get_common_name(scientific_name: str) -> str:
    """Return common name for a scientific name, or the name itself."""
    return _birdnet_labels.get(scientific_name.lower(), scientific_name)


def load_models_once():
    """
    Lazy-import all heavy ML libraries and cache models in GPU memory.
    Thread-safe: uses a lock to prevent double-loading on concurrent requests.
    """
    global _cached_analyzer, _cached_yamnet_model, _cached_yamnet_classes
    global _cached_perch_model, COUNCIL_AVAILABLE, _cached_perch_classes

    with _model_lock:
        from birdnetlib import Recording as _Recording
        from birdnetlib.analyzer import Analyzer as _Analyzer
        import numpy as np
        import librosa

        try:
            import tensorflow as tf
            import tensorflow_hub as hub
            import csv
            COUNCIL_AVAILABLE = True
        except ImportError:
            print("[WARN] TensorFlow/TF-Hub not found. Running BirdNET-only mode.")

        if _cached_analyzer is None:
            print("Loading BirdNET Analyzer (Lead Model, 60% weight)…")
            _cached_analyzer = _Analyzer()
            _load_birdnet_labels()
            print("BirdNET loaded!")

        if COUNCIL_AVAILABLE:
            os.environ["TFHUB_CACHE_DIR"] = os.path.join(os.getcwd(), "tfhub_models")

            if _cached_yamnet_model is None:
                print("Loading YAMNet (Noise Validator, 25% weight)…")
                try:
                    import tensorflow_hub as hub
                    _cached_yamnet_model = hub.load("https://tfhub.dev/google/yamnet/1")
                    class_map_path = _cached_yamnet_model.class_map_path().numpy().decode("utf-8")
                    classes = []
                    import csv
                    with open(class_map_path) as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            classes.append(row["display_name"])
                    _cached_yamnet_classes = classes
                    print("YAMNet loaded!")
                except Exception as e:
                    print(f"[WARN] YAMNet load failed: {e}")

            if _cached_perch_model is None:
                print("Loading Google Perch (Peer Reviewer, 15% weight)…")
                try:
                    import tensorflow_hub as hub
                    _cached_perch_model = hub.load("https://tfhub.dev/google/bird-vocalization-classifier/4")
                    _load_perch_labels()
                    print("Perch loaded!")
                except Exception as e:
                    print(f"[WARN] Perch load failed: {e}")


def _yamnet_bird_probability(yamnet_model, yamnet_classes, audio_16k) -> float:
    """
    Returns the probability that the audio contains bird sounds,
    as a continuous [0,1] score (not a binary flag).
    """
    import numpy as np
    audio_16k = np.clip(audio_16k, -1.0, 1.0)
    scores, _, _ = yamnet_model(audio_16k)
    avg_scores = np.mean(scores.numpy(), axis=0)

    bird_kws  = ['bird', 'animal', 'wildlife', 'chirp', 'squawk', 'owl',
                 'crow', 'pigeon', 'sparrow', 'canary', 'robin', 'finch']
    noise_kws = ['engine', 'truck', 'car', 'machine', 'motor', 'vehicle',
                 'noise', 'static', 'wind', 'music', 'speech', 'human']

    # Build probability as weighted sum of bird-class scores
    bird_prob  = sum(avg_scores[i] for i, c in enumerate(yamnet_classes) if any(k in c.lower() for k in bird_kws))
    noise_prob = sum(avg_scores[i] for i, c in enumerate(yamnet_classes) if any(k in c.lower() for k in noise_kws))

    # Soft score: bird_prob normalized by total signal
    total = bird_prob + noise_prob + 1e-9
    return float(bird_prob / total)


def _perch_probabilities(perch_model, audio_32k) -> dict:
    """Returns a dictionary of scientific_name -> probability from Google Perch."""
    import numpy as np
    try:
        import tensorflow as tf
        frame_step = 32000 * 5
        if len(audio_32k) > frame_step:
            y_perch = audio_32k[:frame_step]
        else:
            y_perch = np.pad(audio_32k, (0, max(0, frame_step - len(audio_32k))))
        logits = perch_model.infer_tf(tf.constant(y_perch[tf.newaxis, :]))[0]["predictions"]
        probabilities = tf.nn.softmax(logits).numpy()
        
        perch_probs = {}
        for idx, prob in enumerate(probabilities):
            if idx < len(_cached_perch_classes):
                sci_name = _cached_perch_classes[idx]
                if sci_name:
                    perch_probs[sci_name] = max(perch_probs.get(sci_name, 0.0), float(prob))
        return perch_probs
    except Exception as e:
        print(f"[WARN] Perch inference error: {e}")
        return {}


def main(
    lat=None,
    lon=None,
    week=-1,
    n_sources=2,
    run_id="none",
    results_dir=".",
    progress_callback=None,
):
    """
    Improved ensemble inference:
    - Weighted voting: BirdNET(60%) + YAMNet(25%) + Perch(15%)
    - Adaptive threshold (rejects low-confidence noise detections)
    - Common name lookup
    - Detection timestamps
    """
    import numpy as np
    import librosa

    def emit(stage: str, msg: str, pct: int):
        print(f"[{pct:>3}%] {msg}")
        if progress_callback:
            progress_callback(stage, msg, pct)

    load_models_once()
    analyzer     = _cached_analyzer
    yamnet_model = _cached_yamnet_model
    yamnet_classes = _cached_yamnet_classes
    perch_model  = _cached_perch_model

    from birdnetlib import Recording

    # Locate the processed directory
    processed_dir = os.path.join(results_dir, "processed") if results_dir != "." else "processed"

    results = []

    splits = ["train", "val", "test"]
    for split in splits:
        split_dir = os.path.join(processed_dir, split)
        if not os.path.exists(split_dir):
            continue

        species_folders = os.listdir(split_dir)

        for species in species_folders:
            species_clean = species.replace("_", " ")
            species_dir   = os.path.join(split_dir, species)

            all_files     = os.listdir(species_dir)
            original_wavs = [f for f in all_files if f.endswith("_original.wav")]

            emit("birdnet", f"Analysing {len(original_wavs)} file(s) for {species_clean}…", 58)

            for orig_file in tqdm(original_wavs, desc=species_clean):
                base_name = orig_file.replace("_original.wav", "")

                # Collect all stems (original + NMF sources)
                file_paths: dict[str, str] = {
                    "Original": os.path.join(species_dir, orig_file)
                }
                i = 0
                while True:
                    sp = os.path.join(species_dir, f"{base_name}_source_{i}.wav")
                    if os.path.exists(sp):
                        file_paths[f"Source_{i}"] = sp
                        i += 1
                    else:
                        break

                # ── Segment-based ensembling & deduplication ──────────────────
                # segment_scores: species -> segment_index -> max_confidence
                segment_scores: dict[str, dict[int, float]] = {}
                best_scores: dict[str, float] = {k: 0.0 for k in file_paths}
                # species_segment_timestamps: species -> segment_index -> (start_time, end_time)
                species_segment_timestamps: dict[str, dict[int, tuple[float, float]]] = {}

                for key, path in file_paths.items():
                    if not os.path.exists(path):
                        continue

                    # Load audio once at 32 kHz (highest required by Perch)
                    try:
                        y_32k, _ = librosa.load(path, sr=32000, mono=True)
                    except Exception as e:
                        print(f"[WARN] Could not load {path}: {e}")
                        continue

                    # ── BirdNET inference ─────────────────────────────────────
                    recording = Recording(
                        analyzer, path,
                        lat=lat, lon=lon, week_48=week,
                        min_conf=0.03,  # Low threshold; ensemble filter applied below
                    )
                    recording.analyze()

                    # ── YAMNet bird probability ───────────────────────────────
                    yamnet_bird_prob = 0.5  # neutral default
                    if yamnet_model is not None:
                        try:
                            emit("yamnet", "YAMNet noise validation…", 70)
                            y_16k = librosa.resample(y_32k, orig_sr=32000, target_sr=16000)
                            yamnet_bird_prob = _yamnet_bird_probability(yamnet_model, yamnet_classes, y_16k)
                        except Exception as e:
                            print(f"[WARN] YAMNet error for {path}: {e}")

                    # ── Perch probabilities ───────────────────────────────────
                    perch_probs = {}
                    if perch_model is not None:
                        try:
                            emit("perch", "Google Perch review…", 82)
                            perch_probs = _perch_probabilities(perch_model, y_32k)
                        except Exception as e:
                            print(f"[WARN] Perch error for {path}: {e}")

                    # ── Weighted ensemble per detection ───────────────────────
                    for detection in recording.detections:
                        sp_name = detection["scientific_name"]
                        bn_conf = detection["confidence"]
                        start_t = detection.get("start_time", 0.0)
                        end_t   = detection.get("end_time",   3.0)

                        # Match Perch's confidence by scientific name (normalized to spaces)
                        sp_name_lower = sp_name.lower().replace("_", " ")
                        sp_perch_conf = perch_probs.get(sp_name_lower, 0.0)

                        # Weighted ensemble score
                        ensemble_conf = min(1.0,
                            W_BIRDNET * bn_conf +
                            W_YAMNET  * yamnet_bird_prob * bn_conf +
                            W_PERCH   * sp_perch_conf
                        )

                        # Legacy target tracking
                        if sp_name.lower() == species_clean.lower():
                            if ensemble_conf > best_scores[key]:
                                best_scores[key] = ensemble_conf

                        # Segment-based accumulation (deduplicating same segment across stems)
                        seg_idx = int(round(start_t) / 3.0)
                        
                        if sp_name not in segment_scores:
                            segment_scores[sp_name] = {}
                        if sp_name not in species_segment_timestamps:
                            species_segment_timestamps[sp_name] = {}

                        # Take the maximum confidence for this species in this segment across all stems
                        segment_scores[sp_name][seg_idx] = max(
                            segment_scores[sp_name].get(seg_idx, 0.0), ensemble_conf
                        )
                        species_segment_timestamps[sp_name][seg_idx] = (start_t, end_t)

                emit("voting", "Temporal voting & ranking…", 90)

                # ── Aggregate scores per species ──────────────────────────────
                species_temporal_scores: dict[str, float] = {}
                species_max_confidence:  dict[str, float] = {}
                species_timestamps:      dict[str, list]  = {}

                for sp_name, segs in segment_scores.items():
                    # Sum of max confidences across all segments
                    species_temporal_scores[sp_name] = sum(segs.values())
                    # Maximum confidence across all segments
                    species_max_confidence[sp_name] = max(segs.values())
                    
                    # Timestamps sorted by confidence descending
                    sorted_segs = sorted(segs.items(), key=lambda x: x[1], reverse=True)
                    species_timestamps[sp_name] = []
                    for seg_idx, conf in sorted_segs:
                        start_t, end_t = species_segment_timestamps[sp_name][seg_idx]
                        species_timestamps[sp_name].append({
                            "start": round(start_t, 2),
                            "end":   round(end_t,   2),
                            "conf":  round(conf, 4),
                        })

                # Determine total segments in the recording for normalization
                total_duration = 0.0
                try:
                    orig_path = file_paths.get("Original")
                    if orig_path and os.path.exists(orig_path):
                        total_duration = librosa.get_duration(path=orig_path)
                except Exception:
                    pass
                n_segments = max(1, int(round(total_duration) / 3.0))

                # Normalize temporal scores by total duration segments
                normalized = {sp: s / n_segments for sp, s in species_temporal_scores.items()}

                # ── Adaptive threshold on max confidences ─────────────────────
                all_confs = list(species_max_confidence.values())
                if all_confs:
                    mu  = float(np.mean(all_confs))
                    sig = float(np.std(all_confs))
                    threshold = max(0.10, min(mu + 0.2 * sig, 0.35))
                else:
                    threshold = 0.15

                # Build sorted predictions with common names
                top_predictions = []
                for sp_name, temp_score in sorted(normalized.items(), key=lambda x: x[1], reverse=True):
                    conf = species_max_confidence.get(sp_name, 0.0)
                    if conf < threshold and len(top_predictions) > 0:
                        continue  # skip low-confidence noise hits after first result
                    top_predictions.append({
                        "species":      sp_name,
                        "common_name":  get_common_name(sp_name),
                        "confidence":   round(float(conf), 6),
                        "temporal_score": round(float(temp_score), 4),
                        "timestamps":   species_timestamps.get(sp_name, [])[:5],
                    })
                    if len(top_predictions) >= max(2, n_sources + 1):
                        break

                overall_top   = top_predictions[0]["species"]    if top_predictions else "None"
                overall_conf  = top_predictions[0]["confidence"] if top_predictions else 0.0
                ensemble_score = max(best_scores.values()) if best_scores else 0.0

                is_correct = "Yes" if overall_top.lower() == species_clean.lower() else "No"

                res_dict = {
                    "Filename":                base_name,
                    "Run_ID":                  run_id,
                    "True_Species":            species_clean,
                    "Top_Predicted_Species":   overall_top,
                    "Top_Common_Name":         get_common_name(overall_top),
                    "Top_Prediction_Confidence": overall_conf,
                    "Top_Predictions_JSON":    json.dumps(top_predictions),
                    "Is_Prediction_Correct?":  is_correct,
                    "Split":                   split,
                    "Score_Original":          best_scores.get("Original", 0.0),
                    "Ensemble_Score":          ensemble_score,
                    "Did_Separation_Help?": "Yes" if ensemble_score > best_scores.get("Original", 0.0) else "No",
                }

                for idx in range(len(file_paths) - 1):
                    res_dict[f"Score_Source{idx}"] = best_scores.get(f"Source_{idx}", 0.0)

                results.append(res_dict)

    df_new = pd.DataFrame(results)
    csv_path = os.path.join(results_dir, "results.csv")
    df_new.to_csv(csv_path, index=False)

    emit("complete", f"Done! {len(results)} prediction(s) written.", 98)

    print(f"\n--- RESULTS SUMMARY ---")
    print(f"Files processed : {len(results)}")
    print(f"Results CSV     : {csv_path}")

    if "Did_Separation_Help?" in df_new.columns and len(df_new) > 0:
        helped = len(df_new[df_new["Did_Separation_Help?"] == "Yes"])
        pct = (helped / len(df_new)) * 100
        print(f"NMF separation boosted confidence in {helped}/{len(df_new)} files ({pct:.1f}%)")


if __name__ == "__main__":
    main()

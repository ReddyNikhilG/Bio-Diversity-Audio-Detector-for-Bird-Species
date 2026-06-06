# 🐦 Bird Audio Species Detector — Complete Setup & Run Guide

> **Project Folder (Google Drive):** `Minor_Project-main`  
> **Architecture:** Lightweight Streamlit UI on your laptop ↔ Heavy ML inference on Google Colab GPU

---

## 📐 Architecture Overview

```
┌─────────────────────────────────┐        ┌──────────────────────────────────────────┐
│        YOUR LAPTOP              │        │           GOOGLE COLAB (GPU)             │
│   (Zero ML libraries)           │        │                                          │
│                                 │        │  FastAPI Server  ←─ colab_api.py         │
│  streamlit run app.py           │        │       │                                  │
│         │                       │        │       ├── NMF Source Separation          │
│         │  POST /analyze        │        │       │   (scikit-learn, no GPU needed)  │
│         └──────────────────────►│        │       │                                  │
│                                 │        │       ├── BirdNET Inference (GPU)        │
│  ◄── JSON predictions ──────────│        │       │   (Lead Model)                   │
│                                 │        │       │                                  │
│  Requirements:                  │        │       ├── YAMNet Validation (GPU/TFHub)  │
│  streamlit, pandas, numpy       │        │       │   (Noise Validator)              │
│  scipy, plotly, requests        │        │       │                                  │
│  wikipedia                      │        │       └── Google Perch Review (GPU/TFHub)│
└─────────────────────────────────┘        │           (Peer Reviewer)                │
                                           └──────────────────────────────────────────┘
```

**Your laptop does zero ML processing.** All source separation, BirdNET, YAMNet, and Perch inference run exclusively on Google Colab's T4/A100 GPU.

---

## ✅ Prerequisites

| What | Where | Notes |
|------|-------|-------|
| Python 3.10+ | Local laptop | [python.org](https://python.org) |
| Google Account | — | For Google Drive + Colab |
| `Minor_Project-main` folder | Google Drive (MyDrive root) | Must match this exact name |
| Google Colab open | [colab.research.google.com](https://colab.research.google.com) | Free account works (T4 GPU) |

---

## 🚀 HOW TO RUN — Step by Step

---

### PART A — One-Time Local Setup (Do this once on your laptop)

**Step A.1 — Navigate to the project folder**

```powershell
cd C:\Users\reddy\Downloads\Minor_Project-main
```

**Step A.2 — Install lightweight local dependencies (UI only, no ML)**

```powershell
pip install -r requirements_local.txt
```

This installs only: `streamlit`, `pandas`, `numpy`, `scipy`, `plotly`, `requests`, `wikipedia`.  
**No TensorFlow, PyTorch, or BirdNET will be installed on your laptop.**

---

### PART B — Start the Google Colab GPU Backend (Do this every session)

> ⚠️ Colab sessions expire after ~12 hours of inactivity. You need to restart the backend each time.

**Step B.1 — Open the notebook in Google Colab**

1. Go to [Google Drive](https://drive.google.com)
2. Navigate into your `Minor_Project-main` folder
3. Double-click `orch.ipynb` → it opens in Google Colab automatically

**Step B.2 — Switch to GPU runtime**

```
Colab Menu → Runtime → Change runtime type → Hardware accelerator → GPU (T4) → Save
```

**Step B.3 — Run the notebook cells in order**

Run **Section 1** cells from top to bottom (click ▶ on each):

| Cell | What it does |
|------|--------------|
| **Cell 1.1** — Mount Drive | Connects your Google Drive to Colab |
| **Cell 1.2** — Verify GPU | Confirms a GPU (Tesla T4) is assigned |
| **Cell 1.3** — CD to project | Changes directory to `Minor_Project-main` |
| **Cell 1.4** — Install deps | Installs BirdNET, TensorFlow, FastAPI, etc. on Colab |

> ⏳ Cell 1.4 takes **3–5 minutes** the first time. Subsequent runs are faster (cached).

**Step B.4 — Start the FastAPI GPU Server**

Run **Cell 4.1** (Section 4):

```python
# This starts uvicorn in a background thread
# Output lines will appear as [SERVER] logs
```

> ⏳ Wait **~30 seconds** after running this cell. The server needs to load BirdNET, YAMNet, and Perch models into GPU memory.

**Step B.5 — Get your public API URL**

Run **Cell 4.2** — it installs localtunnel and prints a URL like:

```
============================================================
Your Colab API URL:
  https://strong-foxes-learn.loca.lt
============================================================
Paste the URL above into the Streamlit dashboard on your laptop!
```

> 📋 **Copy this URL.** You will paste it into the Streamlit dashboard.

> ⚠️ **If localtunnel shows a password page:** Open the URL in your browser, click the **"Click to Continue"** button, then the dashboard connection will work.

**Step B.6 — Verify the server is healthy**

Run **Cell 4.3** — it pings `/health` and prints:

```
Server status  : ok
GPU devices    : ['/physical_device:GPU:0']
Models loaded  : {
  "BirdNET": true,
  "YAMNet": true,
  "Perch": true
}
```

If all three models show `true`, the backend is fully ready.

---

### PART C — Launch the Dashboard on Your Laptop

**Step C.1 — Open a terminal in the project folder**

```powershell
cd C:\Users\reddy\Downloads\Minor_Project-main
streamlit run app.py
```

The dashboard opens at **http://localhost:8501**

**Step C.2 — Connect the dashboard to the Colab backend**

1. In the left panel, paste your **Colab API URL** (from Step B.5) into the `Colab API URL` field
2. Wait for the **🟢 Connected** badge — it shows:
   - GPU name (e.g., `Tesla T4`)
   - Model status: `BirdNET ✅  YAMNet ✅  Perch ✅`

**Step C.3 — Analyse a bird audio file**

1. Click **"Upload Audio File"** → select a `.wav`, `.mp3`, `.flac`, or `.ogg` file (max 50 MB)
2. *(Optional)* Adjust **NMF Separation Sources** (2 is recommended for most recordings)
3. *(Optional)* Enable **Geographic Filter** and enter latitude/longitude for location-aware results
4. Click **🚀 RUN ANALYSIS ON COLAB GPU**

**Step C.4 — Read the results**

| Result panel | What it shows |
|---|---|
| **Primary Detection** | Top bird species with confidence % |
| **Secondary Detections** | Additional species found in the audio |
| **Wikipedia Card** | Species description + photo from Wikipedia |
| **Raw Data Matrix** | Full CSV row with all confidence scores |
| **Download Report** | Text report you can save |

> ⏳ **First analysis:** ~60–120 seconds (model warm-up)  
> ⚡ **Subsequent analyses:** ~10–30 seconds (models already in GPU memory)

---

## 🔄 Pipeline Flow (What happens when you click Run)

```
1. app.py         → Reads uploaded audio, sends to Colab via HTTP POST /analyze
2. colab_api.py   → Receives audio, validates size (max 50 MB), saves to input/
3. main.py        → Orchestrates the 2-phase pipeline:
       Phase 1: DatasetBuilder (preprocess/) → NMF source separation
                 Splits audio into n_sources stems (e.g., bird call + background)
       Phase 2: eval_prebuilt.main() → Council of Models inference:
                 ├── BirdNET analyzes original + each stem
                 ├── YAMNet validates: is this actually a bird? (noise filter)
                 ├── Perch peer-reviews the top detection
                 └── Temporal voting: sums confidence across all chunks & stems
4. colab_api.py   → Reads prebuilt_birdnet_evaluation.csv, filters by run_id
5. app.py         → Displays results: species name, confidence, Wikipedia info
```

---

## 🐛 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 🔴 `Cannot reach Colab` | Tunnel expired or server crashed | Re-run Cells 4.1 and 4.2 in Colab; copy new URL |
| ⏳ `BirdNET: ⏳ YAMNet: ⏳` | Models still loading | Wait 60s after Cell 4.1 then click **Re-check Connection** |
| `GPU not detected!` error in Colab | Wrong runtime type | Go to Runtime → Change runtime type → GPU |
| `No predictions returned` | Audio has no detectable bird calls | Try a cleaner recording; lower NMF sources to 1 |
| `File too large` (413 error) | File exceeds 50 MB | Trim audio to under 5 minutes at 128kbps |
| Localtunnel shows password | Browser security prompt | Open the URL in browser once, click **Click to Continue** |
| `colab_api.py not found` error | Wrong working directory | Ensure Cell 1.3 ran successfully; re-run it |
| `ModuleNotFoundError: birdnetlib` | Deps not installed on Colab | Re-run Cell 1.4 (`pip install -r requirements_colab.txt`) |
| Dashboard shows demo only | No Colab URL entered | Paste the localtunnel URL into the connection field |
| Wikipedia info missing | Network issue on Colab | Harmless — analysis results still show; retry later |

---

## 📁 Project File Reference

```
Minor_Project-main/
│
├── app.py                        ← Local Streamlit dashboard (run this on laptop)
├── colab_api.py                  ← FastAPI GPU server (runs on Colab only)
├── main.py                       ← Pipeline orchestrator (Phase 1 + Phase 2)
├── eval_prebuilt.py              ← BirdNET + YAMNet + Perch inference engine
│
├── preprocess/
│   ├── audio_processor.py        ← Resampling, high-pass filter, normalization
│   ├── audio_separator.py        ← NMF source separation
│   ├── dataset_builder.py        ← Builds train/val/test splits from input/
│   ├── feature_extractor.py      ← Mel spectrogram generation
│   └── config.py                 ← Sample rate (22050 Hz), FFT settings
│
├── utils/
│   └── file_utils.py             ← Directory helpers
│
├── orch.ipynb                    ← Google Colab orchestration notebook
├── requirements_local.txt        ← Laptop dependencies (UI only)
├── requirements_colab.txt        ← Colab dependencies (full ML stack)
├── prebuilt_birdnet_evaluation.csv ← Results CSV (written on Colab)
├── sample_bird_chirp.wav         ← Demo audio (Red-vented Bulbul)
└── SETUP.md                      ← This file
```

---

## ⚡ Quick Reference Card

```
EVERY SESSION:
══════════════
[COLAB]  1. Open orch.ipynb → Runtime: GPU
         2. Run Cell 1.1 (Mount Drive)
         3. Run Cell 1.2 (Verify GPU)
         4. Run Cell 1.3 (cd to project)
         5. Run Cell 1.4 (Install deps) ← only needed after Colab restart
         6. Run Cell 4.1 (Start server) ← wait 30s
         7. Run Cell 4.2 (Get URL)      ← copy the printed URL
         8. Run Cell 4.3 (Health check) ← confirm all 3 models ✅

[LAPTOP] 9. cd Minor_Project-main
        10. streamlit run app.py
        11. Paste the Colab URL → 🟢 Connected
        12. Upload audio → 🚀 Run → Results!
```

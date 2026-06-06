# 🦜 BirdSense AI — Full-Stack Setup Guide

This is a **full-stack bird species detection system** where:
- The **website + ML backend** runs on **Google Colab T4 GPU**
- Your laptop is only used to open a **browser tab**
- **Zero local ML computation** — your laptop never touches TensorFlow, PyTorch, or audio processing

---

## Architecture

```
Your Browser → Colab Tunnel URL → FastAPI (Colab T4 GPU)
                                      ├── Serves the website (HTML/CSS/JS)
                                      ├── ML inference (BirdNET + YAMNet + Perch)
                                      ├── Audio preprocessing & NMF separation
                                      └── Wikipedia proxy & results
```

---

## Option A — Full website via Colab (Recommended)

Everything — the website AND the AI — runs from Colab. Your laptop only needs a browser.

### Step 1 — Set T4 GPU runtime

1. Open **orch.ipynb** in Google Colab ([upload to Drive first if not there](https://drive.google.com))
2. `Runtime → Change runtime type → GPU → T4`
3. Click **Save**

### Step 2 — Run cells in order

Open `orch.ipynb` and run each section top-to-bottom:

| Section | Cells | What it does | Time |
|---------|-------|------|------|
| **§1 Setup** | 1.1 – 1.4 | Mount Drive, verify GPU, install all packages | ~3 min |
| **§2 Dataset** | 2.1 – 2.3 | Download training audio from Xeno-Canto | ~20 min (skip if done) |
| **§3 Server** | 3.1 | Pre-load all 3 AI models into GPU memory | ~2 min |
| **§3 Server** | 3.2 | Build the Next.js website | ~1 min |
| **§3 Server** | 3.3 | Start FastAPI backend on port 8000 | ~10 sec |
| **§3 Server** | 3.4 | Start tunnel → **prints the public URL** | ~5 sec |
| **§3 Server** | 3.5 | Health check: verify all models loaded | instant |
| **§4 Keepalive** | 4.1 | Start background pinger (keeps session alive) | runs forever |

### Step 3 — Get the URL

After running **Cell 3.4**, a green box appears showing your public URL:

```
🌐 BirdSense AI Public URL
https://xxxx-xxxx.ngrok-free.app
```

### Step 4 — Open the website

**Either:**
- Open the URL directly in your browser → the full BirdSense AI website loads from Colab
- OR paste it into the website's **🔌 Colab GPU Connection** field

---

## Option B — Local dev server (advanced)

If you want to run the frontend locally on your laptop (just HTML/CSS/JS, no ML):

```powershell
cd C:\Users\reddy\Downloads\Minor_Project-main\frontend
npm install
npm run dev
```

This starts at `http://localhost:3000`. Then paste the Colab tunnel URL into the connection field.

> **Note:** `npm run dev` only serves HTML/CSS/JS. It does ZERO ML computation. Safe for any laptop.

---

## Using the Website

1. **Connect** — Paste the Colab URL into the connection panel → click **Connect**
2. **Wait** for ✅ BirdNET, ✅ YAMNet, ✅ Perch model badges to appear
3. **Upload** — Drag and drop a bird audio file (WAV / MP3 / FLAC / OGG, max 50 MB)
4. **Configure** — Set NMF sources (2–3 for recordings with multiple overlapping birds)
5. **Run** — Click **🚀 Run Analysis on Colab GPU**
6. **Watch** the real-time progress bar as each stage completes on the T4 GPU
7. **View** detected species with Wikipedia photos, confidence rings, and detection timestamps

---

## What runs where

| Task | Location |
|------|----------|
| Website HTML/CSS/JS | Colab (served via FastAPI at `/`) |
| Audio preprocessing | Colab T4 GPU |
| NMF source separation | Colab T4 GPU |
| BirdNET inference (60%) | Colab T4 GPU |
| YAMNet validation (25%) | Colab T4 GPU |
| Google Perch review (15%) | Colab T4 GPU |
| Wikipedia info lookup | Colab (proxy endpoint, cached) |
| Your laptop | Opens a browser tab only |

---

## orch.ipynb Cell Reference

| Cell ID | Title | When to run |
|---------|-------|-------------|
| 1.1 | Mount Google Drive | Every session |
| 1.2 | Verify GPU | Every session |
| 1.3 | cd to project | Every session |
| 1.4 | Install packages | Every session (fast after first run) |
| 2.1 | Configure species & API key | Only when updating species list |
| 2.2 | Define download helpers | Only before 2.3 |
| 2.3 | Download audio from Xeno-Canto | Only when collecting new data |
| 3.1 | Pre-load AI models | Every session |
| 3.2 | Build Next.js frontend | Every session |
| 3.3 | Start FastAPI server | Every session |
| 3.4 | Start tunnel + print URL | Every session |
| 3.5 | Health check | Every session |
| 4.1 | Keepalive (background pinger) | Every session |
| 5.1 | GPU memory status | Optional diagnostic |
| 5.2 | Restart server | If server crashes |
| 5.3 | Test with sample audio | Optional sanity check |

---

## ngrok Setup (Recommended for stable URLs)

Localtunnel URLs are randomly assigned and sometimes require browser confirmation. For a stable, reliable URL, use ngrok:

1. Create a free account at [ngrok.com](https://ngrok.com)
2. Copy your auth token from the ngrok dashboard
3. In Colab: click the 🔑 **Secrets** icon (left panel)
4. Add a secret: `NGROK_TOKEN` = `your-auth-token`
5. Cell 3.4 will automatically use it

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot reach Colab` | Re-run Cell 3.4, copy the new URL |
| Models still loading (⏳) | Wait 2–3 min, re-run Cell 3.5 |
| `GPU not detected` | `Runtime → Change runtime type → T4 GPU` |
| No predictions returned | Try cleaner audio, set NMF sources to 1 |
| File too large | Trim audio to under 50 MB |
| Tunnel URL expired | Colab sessions expire after ~12 hours; re-run §3 cells |
| Server crashed | Run Cell 5.2 to restart it |
| `Module not found` | Re-run Cell 1.4 to reinstall packages |

---

## Every New Colab Session

Colab sessions expire after ~12 hours or when inactive too long. Each new session:

1. Open `orch.ipynb` in Colab with T4 GPU
2. Run **§1 Setup** cells (1.1 → 1.4)
3. Run **§3 Server** cells (3.1 → 3.5)
4. Run **§4 Keepalive** cell (4.1)
5. Copy the new tunnel URL from Cell 3.4

You do **not** need to re-download the dataset (§2) — it's already saved in Google Drive.  
You do **not** need to reinstall anything on your laptop.

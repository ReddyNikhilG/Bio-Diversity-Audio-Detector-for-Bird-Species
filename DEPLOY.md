# 🚀 BirdSense — Deploy Backend (Modal.com · Free GPU)

## What is Modal?
- Serverless GPU cloud — you only pay while a request is running
- **Free $30 GPU credit every month** (resets on the 1st)
- Always online — permanent URL, no manual start needed
- Your laptop does **zero** computation

---

## Files You Need (already created)

```
Minor_Project-main/
├── modal_app.py          ← Modal deployment config  ✅
├── backend/
│   └── api.py            ← FastAPI backend           ✅
├── main.py               ← Pipeline runner           ✅ (existing)
├── eval_prebuilt.py      ← ML model inference        ✅ (existing)
├── preprocess/           ← Audio preprocessing       ✅ (existing)
└── utils/                ← Utilities                 ✅ (existing)
```

**You do NOT need to touch any of these files. Just run the 3 commands below.**

---

## Step 1 — Install Modal

Open **PowerShell** and run:

```powershell
pip install modal
```

---

## Step 2 — Create a free Modal account + login

```powershell
modal token new
```

This opens your browser automatically.
1. Click **Sign up** → use Google or GitHub login (free)
2. Click **Authorize**
3. PowerShell shows: `✅ Token saved`

---

## Step 3 — Deploy

```powershell
cd C:\Users\reddy\Downloads\Minor_Project-main
modal deploy modal_app.py
```

> [!TIP]
> **Windows / PowerShell Encoding Error?**
> If your deploy command fails with a `'charmap' codec can't encode characters` error, run it with the UTF-8 encoding environment variable set:
> ```powershell
> $env:PYTHONIOENCODING="utf-8"; modal deploy modal_app.py
> ```

**First time takes 10–15 minutes** (downloads CUDA, installs all Python packages).  
After that, re-deploys take ~2 minutes.

When it finishes you will see:

```
✓ Created web endpoint =>
  https://YOUR-NAME--birdsense-api.modal.run
```

---

## Step 4 — Test it works

Open this URL in your browser:

```
https://YOUR-NAME--birdsense-api.modal.run/health
```

You should see:

```json
{
  "status": "ok",
  "gpu_devices": ["GPU:0"],
  "models_loaded": {
    "BirdNET": true,
    "YAMNet": true,
    "Perch": true
  }
}
```

Also see the interactive API docs at:
```
https://YOUR-NAME--birdsense-api.modal.run/docs
```

---

## Step 5 — Connect your frontend

In the BirdSense app → **🔌 Connect to Colab GPU** field, paste:

```
https://YOUR-NAME--birdsense-api.modal.run
```

Click **Connect** → you'll see all 3 model badges turn ✅ green.

That's it. Upload audio and run your analysis. Your laptop does nothing. ✅

---

## Updating the backend later

If you change `main.py`, `eval_prebuilt.py`, or `backend/api.py`:

```powershell
cd C:\Users\reddy\Downloads\Minor_Project-main
modal deploy modal_app.py
```

Modal automatically rebuilds and redeploys in ~2 minutes.

---

## Monitoring

Go to [modal.com/apps](https://modal.com/apps) to see:
- 📊 Live request logs
- 💰 Usage / credit remaining
- 🖥️ GPU memory graphs
- 🔁 Auto-restart settings

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `modal: command not found` | Run `pip install modal` again |
| `Token not found` | Run `modal token new` again |
| `/health` shows models=false | Wait 3–4 min — models download from TF Hub on first boot |
| `GPU:0` not showing | Check Modal dashboard → your function should show `gpu="T4"` |
| Analysis times out | Increase `timeout=360` in `modal_app.py` |
| Out of free credits | $30 resets on 1st of each month |

---

## What runs where

```
Your Laptop           → Opens browser only, zero computation
Frontend (Render/etc) → Serves the HTML/CSS/JS website
Modal.com T4 GPU      → Runs all AI:
                          ├── BirdNET (60%)
                          ├── YAMNet (25%)
                          ├── Google Perch (15%)
                          └── NMF source separation
```

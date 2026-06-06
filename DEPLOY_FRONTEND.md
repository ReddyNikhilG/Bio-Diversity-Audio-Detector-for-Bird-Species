# 🚀 BirdSense Frontend — Vercel Deployment Guide

Because this frontend uses **TanStack Start** (a full-stack React framework with server-side rendering/SSR), it has been configured to build with **Nitro** targeting the **Vercel Build Output API v3**.

When built, it compiles serverless functions into the `.vercel/output/` directory, allowing Vercel to host the app with full SSR support.

---

## Option 1 — Deploy via Vercel Dashboard (Recommended)

This connects Vercel directly to your Git repository (GitHub/GitLab) so every time you push code, Vercel automatically deploys it.

1. **Push your code to GitHub:**
   Make sure all your changes (including the updated `vite.config.ts` and `src/lib/birdsense/store.ts` default URL) are pushed to your GitHub repository.

2. **Open Vercel Dashboard:**
   * Go to [vercel.com](https://vercel.com) and log in.
   * Click **Add New > Project**.

3. **Import Your Repository:**
   * Select your GitHub repository from the list and click **Import**.

4. **Configure Project Settings:**
   * **Framework Preset:** Select **Other** or **Vite** (Vercel will auto-detect the `.vercel/output` directory compiled by Nitro).
   * **Build Command:** Keep as default (`npm run build` or `vite build`).
   * **Output Directory:** Keep as default (or set to `.vercel/output`).
   * **Root Directory:** Keep as `./` (root).

5. **Deploy:**
   * Click **Deploy** and wait for Vercel to compile and publish your site!
   * Once finished, you will receive a permanent `https://YOUR-APP.vercel.app` URL.

---

## Option 2 — Deploy via Vercel CLI (Terminal)

If you don't want to use GitHub and prefer deploying directly from your computer terminal:

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Log in to Vercel:**
   ```powershell
   vercel login
   ```
   *(Select login method like GitHub/Google, it will open a browser window to authenticate)*

3. **Link and Deploy your project:**
   Run this in your project root directory (`C:\Users\reddy\Downloads\Minor_Project-main`):
   ```powershell
   vercel
   ```
   * Set up and deploy? **Yes**
   * Which scope? *(Select your personal account)*
   * Link to existing project? **No**
   * What name? **birdsense-frontend**
   * In which directory is your code located? `./`
   * Want to modify build settings? **No**

4. **Production Release:**
   Once the preview deploy completes, push it to production:
   ```powershell
   vercel --prod
   ```

---

## ⚙️ Environment Variables (Optional)

If you need to change your backend URL in the future without editing the source code:
* Go to your Vercel Project Dashboard → **Settings** → **Environment Variables**.
* Add a new environment variable:
  * **Key:** `VITE_BACKEND_URL`
  * **Value:** `https://your-name--birdsense-api-serve.modal.run`

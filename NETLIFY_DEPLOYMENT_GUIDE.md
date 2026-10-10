# DURGA PUJA 2026 KQU - Netlify Deployment Guide

This project is fully configured for deployment on [Netlify](https://www.netlify.com).

---

## 🚀 Quick Summary of Included Config Files
1. **`netlify.toml`** - Automatically configures:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
   - Single Page Application (SPA) redirect rules (`/* -> /index.html 200`)
   - Standalone tracker shortcuts (`/html`, `/standalone`)
   - Security headers
2. **`public/_redirects`** - Redundancy fallback ensuring Netlify handles SPA client-side routes smoothly.
3. **`.nvmrc`** - Pins Node version `20` for Netlify builds.
4. **`netlify/functions/auth-login.ts`** - Serverless handler for committee login.

---

## 🌟 Method 1: Connect via GitHub (Recommended for Auto-Deploy)

1. **Push your code to GitHub**:
   - Push this project to your GitHub repository (e.g. `durga-puja-2026-kqu`).

2. **Log into Netlify**:
   - Visit [app.netlify.com](https://app.netlify.com/) and sign in.

3. **Add new site**:
   - Click **"Add new site"** → **"Import an existing project"**.
   - Select **GitHub** and choose your repository.

4. **Build settings** (Netlify will auto-detect from `netlify.toml`):
   - **Base directory**: Leave blank (root `/`)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. **Environment Variables (Optional)**:
   - If using Gemini AI features on the server:
     - `GEMINI_API_KEY`: Your Gemini API Key
   - Note: The Supabase Cloud database connection (`sgmjrhdfbwvzmkhsssjr.supabase.co`) is already configured in the client code!

6. **Click "Deploy site"**:
   - In 1–2 minutes, Netlify will build and provide your live URL (e.g. `https://durga-puja-2026-kqu.netlify.app`).

---

## 📦 Method 2: Netlify Drop (No Git Required — 1-Minute Direct Upload)

If you just want to publish the site right away without setting up a Git repository:

1. Build the production bundle locally:
   ```bash
   npm run build
   ```
   This generates the production-ready `dist` folder.

2. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**.

3. Drag and drop the `dist` folder directly into the upload area on Netlify.

4. Netlify will instantly assign you a live HTTPS web address!

---

## ⚡ Method 3: Netlify CLI

If you prefer using the command line:

```bash
# 1. Install Netlify CLI globally
npm install -g netlify-cli

# 2. Login to your Netlify account
netlify login

# 3. Build the project
npm run build

# 4. Deploy to production
netlify deploy --prod --dir=dist
```

---

## 🌐 Custom Domain Setup (Optional)
Once deployed on Netlify:
1. Go to **Site settings** → **Domain management**.
2. Click **Add custom domain** (e.g., `durgapujakqu2026.org` or your preferred domain).
3. Follow the DNS instructions (add CNAME or Netlify DNS) to get automatic free SSL.

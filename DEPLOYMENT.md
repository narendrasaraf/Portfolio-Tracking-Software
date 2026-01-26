# 🚀 Deployment Guide - Narendra's Portfolio (WealthFlow)

This guide provides step-by-step instructions for deploying the WealthFlow Portfolio Tracker.

## 📁 Project Structure Review
- **`backend/`**: Node.js/Express server. (Uses Mongoose with a Prisma-like shim for MongoDB).
- **`frontend/`**: React/Vite application.
- **`render.yaml`**: Root configuration for one-click deployment to Render.com.

---

## 1. Prerequisites (Setup These First)
- **MongoDB Atlas**: Create a Free Tier cluster and get your connection string (`mongodb+srv://...`).
- **Google Cloud Console**: (Optional) Create credentials for Google OAuth if you intend to use Google Login.
- **GitHub**: Host your code in a private repository.

---

## 2. Backend Deployment (Render.com)

The backend is configured to run as a Node service.

1. **Connect Repository**: Point Render to your GitHub repo.
2. **Environment Variables**: Add these in the "Environment" tab:
   - `MONGODB_URI`: Your Atlas string (e.g., `mongodb+srv://...`).
   - `JWT_SECRET`: A secure random string.
   - `FRONTEND_URL`: The URL of your live frontend (e.g., `https://wealthflow.vercel.app`).
   - `ADMIN_PASSWORD`: For the initial user setup.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Optional for OAuth.
3. **Build & Start**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

---

## 3. Frontend Deployment (Vercel or Render)

### Option A: Vercel (Recommended)
1. Import your repo to Vercel.
2. **Set Root Directory**: `frontend`.
3. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`
4. Deploy.

### Option B: Render (Static Site)
1. Root Directory: `frontend`
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL`: Your backend URL.

---

## 4. Database Setup (MongoDB Atlas)
- **Whitelisting**: In Network Access, add `0.0.0.0/0` (standard for Render Free Tier).
- **Database Name**: Ensure your connection string includes a DB name (e.g., `.../portfolio?retryWrites=true...`).

---

## 5. Technical Note: Why "Prisma" in the code?
The project uses a custom **Prisma-to-Mongoose bridge** located in `backend/src/utils/db.ts`. 
- **DO NOT** attempt to setup PostgreSQL.
- **DO NOT** run `prisma migrate`. 
- The backend will automatically create MongoDB collections on first run.

---

## 7. 🔐 Google OAuth Configuration (IMPORTANT)
Your current **localhost-only** credentials will **NOT** work in production. You must update your settings in the [Google Cloud Console](https://console.cloud.google.com/):

1. **Find your production URLs**:
   - Backend URL: `https://wealthflow-backend.onrender.com`
   - Frontend URL: `https://wealthflow.vercel.app`

2. **Update OAuth 2.0 Client ID**:
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `https://wealthflow.vercel.app`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://wealthflow-backend.onrender.com/api/auth/google/callback`

3. **Backend Environment Variables**:
   - Ensure `FRONTEND_URL` is set to `https://wealthflow.vercel.app` in your Render dashboard. This ensures the callback redirects you back to the correct production frontend.

---

## 8. 📈 Daily Analytics (Cron Jobs)
To keep your Daily P/L charts updated:
- Set up a free monitoring tool (like [cron-job.org](https://cron-job.org)) to hit your backend endpoint every 24 hours:
  `GET https://your-backend.onrender.com/api/portfolio/daily-change` (This triggers a refresh and updates snapshots).

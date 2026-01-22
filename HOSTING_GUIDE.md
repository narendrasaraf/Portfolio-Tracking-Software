# Hosting Guide for Portfolio Tracker

This guide explains how to deploy your WealthFlow Portfolio Tracker to the web using **GitHub**, **Vercel** (Frontend), and **Render.com** (Backend + Database).

## Prerequisites
1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Vercel Account**: For hosting the frontend.
3.  **Render Account**: For hosting the backend and database.

---

## Step 1: Push Changes to GitHub
I have already updated the following files to make them "deployment-ready":
- `backend/prisma/schema.prisma`: Switched to PostgreSQL (required for Render).
- `backend/package.json`: Added `pg` and automated build scripts.
- `render.yaml`: A "Blueprint" file that sets up both the API and Database on Render automatically.
- `frontend/vercel.json`: Handles SPA routing to prevent 404s on page refresh.

**Action**: Commit and push these changes to your GitHub repository before proceeding.

---

## Step 2: Deploy Backend (Render.com)

Render will now detect the `render.yaml` file and set everything up for you.

1.  **Login to Render** and go to the **Blueprints** section.
2.  Click **New Blueprint Instance**.
3.  Connect your GitHub repository.
4.  Render will show "WealthFlow Backend" and "WealthFlow Database". Click **Apply**.
5.  **Wait** for the deployment to finish.
    -   It will automatically create a PostgreSQL database.
    -   It will automatically link the `DATABASE_URL`.
    -   It will run `prisma generate` and `tsc` to build the app.
6.  **Copy your Backend URL**: Once deployed, go to the "wealthflow-backend" service and copy the URL (e.g., `https://wealthflow-backend-xxxx.onrender.com`).

---

## Step 3: Deploy Frontend (Vercel)

1.  **Login to Vercel** and click **Add New** -> **Project**.
2.  Connect the same GitHub repository.
3.  **Configure Project**:
    -   **Root Directory**: Set this to `frontend` (Very important!).
    -   **Framework Preset**: Vite (should be auto-detected).
4.  **Environment Variables**:
    -   Add a new variable:
        -   **Key**: `VITE_API_URL`
        -   **Value**: Paste your Render Backend URL + `/api` (e.g., `https://wealthflow-backend-xxxx.onrender.com/api`).
        -   *Note: Ensure NO trailing slash.*
5.  **Deploy**: Click "Deploy".

---

## Troubleshooting

### Build Failures on Render
If the build still fails, check the "Logs" in Render:
-   **Missing Dependencies**: I added `pg` to `package.json`, which is required for Postgres.
-   **TypeScript Errors**: Ensure your local code builds with `npm run build` in the backend folder.
-   **Database Connection**: Render Blueprints handle this automatically, but ensure the database is "Available" before the web service tries to start.

### 404 Errors on Refresh
I have added `frontend/vercel.json` to fix this. If you still see 404s, ensure that Vercel is using the `frontend` folder as the root directory.

### Blank Screen / CORS
If the app loads but data doesn't appear:
1.  Check the Browser Console (F12) for errors.
2.  Ensure `VITE_API_URL` exactly matches your Render URL (including `https://` and `/api`).
3.  The backend is currently set to allow all origins (`cors()`), so it should work by default.

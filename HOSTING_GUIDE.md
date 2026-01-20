# Hosting Guide for Portfolio Tracker

This guide explains how to deploy your WealthFlow Portfolio Tracker to the web using **GitHub**, **Vercel** (Frontend), and **Render.com** (Backend + Database).

## Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **Vercel Account**: For hosting the frontend.
3.  **Render Account**: For hosting the backend and database.

---

## Step 1: Database Setup (Important)
Your current project uses **SQLite** (`dev.db`). This works fine on your local computer but is **bad for cloud hosting** (Render/Vercel) because the file will get deleted every time you redeploy.

**You must switch to PostgreSQL for production.**

### 1.1 Update `backend/prisma/schema.prisma`
Change the datasource provider to `postgresql`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.2 Update `backend/.env`
Replace your local `DATABASE_URL` with a real Postgres connection string (you will get this from Render in Step 2).

### 1.3 Install dependencies
In `backend`, run:
```bash
npm uninstall sqlite3
npm install pg
```

---

## Step 2: Deploy Backend (Render.com)

1.  **Create a New Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Root Directory**: `backend`
4.  **Build Command**: `npm install && npx prisma generate && npx tsc`
5.  **Start Command**: `node dist/index.js`
6.  **Environment Variables**:
    *   `DATABASE_URL`: (Create a Postgres DB on Render/Neon/Supabase and paste the URL here)
    *   `ADMIN_PASSWORD`: Your chosen admin password.
    *   `PORT`: `3000` (or `10000`, Render usually sets `PORT` automatically).

7.  **Auto-Deploy**: Click "Create Web Service". Render will build and deploy your API.
    *   *Note: On the first run, you might need to run migrations.* You can add `npx prisma migrate deploy` to the build command or run it manually.

8.  **Copy your Backend URL**: e.g., `https://wealthflow-backend.onrender.com`.

---

## Step 3: Deploy Frontend (Vercel)

1.  **Add New Project** on Vercel.
2.  Connect the same GitHub repository.
3.  **Root Directory**: `frontend`
    *   *Note: You may need to edit "Root Directory" in the project settings if it asks.*
4.  **Framework Preset**: Vite (Vercel usually auto-detects this).
5.  **Build Command**: `vite build` (default).
6.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your Render Backend URL + `/api` (e.g., `https://wealthflow-backend.onrender.com/api`).
    *   **Important**: Do NOT include a trailing slash.
7.  **Deploy**: Click "Deploy".

---

## Troubleshooting

-   **Backend 404s**: Check if your `VITE_API_URL` is correct. It should usually end in `/api`.
-   **Database Errors**: Ensure you ran `npx prisma migrate deploy` against your production database.
-   **CORS Errors**: In `backend/src/index.ts`, ensure your CORS configuration allows your Vercel domain.
    ```typescript
    app.use(cors({
        origin: ["https://your-vercel-app.vercel.app", "http://localhost:5173"]
    }));
    ```

# WealthFlow: Personal Portfolio Tracker 🚀

A premium, full-stack personal finance and portfolio tracking application designed for modern investors. Track your stocks, crypto, mutual funds, and precious metals in one unified, sleek dashboard with live price updates and historical analytics.

## ✨ Features

- 🔐 **Multi-User Secure Authentication**: Full registration and JWT-based login system for private portfolio management.
- 📈 **Dynamic Analytics**: Real-time Daily Gain/Loss (Yesterday vs Today) tracking and historical net worth chronicles.
- 🌍 **Multi-Asset Support**:
  - **Crypto**: Live prices via Binance API (USDT-INR adjusted).
  - **Indian Stocks**: Live quotes via Yahoo Finance.
  - **Mutual Funds**: Latest NAV tracking via MFAPI.
  - **Precious Metals**: Specialized handling for Gold and Silver (Price per Gram/KG).
  - **Cash & Savings**: Direct entry for bank balances.
- 💎 **Premium UI/UX**: Modern, glassmorphic design system with sleek dark mode, micro-animations, and responsive layouts for mobile & desktop.
- ⚡ **Performance**: Optimized backend with in-memory caching for live prices and strategic snapshotting.

## 🔥 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Recharts, Lucide React.
- **Backend**: Node.js, Express, TypeScript, Mongoose (with Prisma-like shim).
- **Database**: MongoDB (Atlas) for high scalability and flexible data structures.
- **Styling**: Modern CSS with Glassmorphism and specialized typography.

## 🛠️ Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas connection string)

### 2. Backend Installation
```bash
cd backend
npm install
# Create a .env file based on the Deployment Guide
npm run dev
```
Backend runs on `http://localhost:3000`

### 3. Frontend Installation
```bash
cd frontend
npm install
# Ensure .env has VITE_API_URL=http://localhost:3000/api
npm run dev
```
Frontend runs on `http://localhost:5173`

## 🚀 Deployment

The project is optimized for a split deployment:
- **Backend**: Recommended for **Render.com** (config included in `render.yaml`).
- **Frontend**: Recommended for **Vercel** or **Render**.
- **Database**: **MongoDB Atlas** (Free Tier).

For detailed production setup including Google OAuth and database whitelisting, please refer to:
👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🔄 Live Price Engine

1. **Binance Engine**: Automatically fetches USDT-INR rates to provide accurate crypto valuations in local currency.
2. **Yahoo Finance Engine**: Real-time stock quotes for Indian equities.
3. **MFAPI Connector**: Retrieves the most recent NAV for mutual fund schemes using 6-digit scheme codes.

---

## 💾 Security & Privacy

- **Data Privacy**: Your financial data is securely stored in your private MongoDB instance.
- **Secrets Management**: Sensitive keys are managed via `.env` and are protected from Git exposure via robust `.gitignore` rules.
- **Encryption**: Passwords are hashed using `bcrypt` and sessions are protected by `JWT`.

---

## 📝 Maintenance
- **Snapshots**: Daily snapshots are automatically generated to build your historical growth chart.
- **Health Check**: Hit `/health` to verify backend status.
- **Manual Refresh**: Trigger a global price sync via the Settings panel in the UI.

Designed with ❤️ for modern investors.

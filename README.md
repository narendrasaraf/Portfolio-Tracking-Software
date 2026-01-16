# Personal Portfolio Tracker

A simple, password-protected personal finance portfolio tracker with **embedded database** - no external database hosting required!

## 🔐 Single-User App

- **Password**: #To be update later#
- No user registration required
- Session-based access

## ✨ Features

- ✅ **Embedded SQLite Database** - No PostgreSQL or Docker needed!
- ✅ Password-protected (personal use only)
- ✅ Track multiple asset types (Crypto, Stocks, MF, Gold, Silver, Cash)
- ✅ Live price fetching for Crypto (CoinGecko) and Mutual Funds (MFAPI)
- ✅ Manual price entry for Stocks, Gold, Silver
- ✅ Add, Edit, Delete assets
- ✅ Real-time profit/loss calculation
- ✅ Mobile-first responsive design

## Tech Stack
- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: SQLite (embedded - travels with your app!)

## Prerequisites
- Node.js (v18+)

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
Backend runs on `http://localhost:3000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## 🔄 Live Price APIs

Your portfolio tracker uses the following APIs for live prices:

1. **Crypto**: [CoinGecko API](https://www.coingecko.com/en/api)
   - **Key needed?**: ❌ No (Uses free public tier)
   - **How it works**: Uses the "API ID" (e.g., `bitcoin`, `ethereum`) to fetch current INR prices.

2. **Mutual Funds**: [MFAPI.in](https://www.mfapi.in/)
   - **Key needed?**: ❌ No (Completely free API for Indian Mutual Funds)
   - **How it works**: Uses the "Scheme Code" (e.g., `120503`) to fetch the latest NAV.

3. **Stocks / Gold / Silver**: **Manual Entry**
   - **Key needed?**: ❌ No
   - **How it works**: You enter the price manually. If you want to automate this, you can integrate services like **Alpha Vantage** or **Twelve Data**.

### 🔑 How to add API Keys (Optional)

If you decide to upgrade to a paid API tier (like CoinGecko Pro) or add a Stocks API:

1. Open `backend/.env`
2. Add your key: `STOCK_API_KEY=your_key_here`
3. Update `backend/src/services/priceService.ts` to use this key in the headers.

---

## 💾 Database Location

Your data is stored in `backend/prisma/dev.db` - this is a simple SQLite file that you can:
- ✅ Back up by copying the file
- ✅ Move to another computer
- ✅ Keep private and secure

## Deployment Ready

This app is perfect for:
- Firebase Hosting (frontend + backend functions)
- Vercel/Netlify
- Any static host + serverless functions
- The SQLite database travels with your deployment!

## Notes

- **Security**: Simple password protection suitable for personal use
- **Backup**: Regularly backup `backend/prisma/dev.db` to preserve your data
- **Portability**: The entire app + database can be zipped and moved anywhere
# Portfolio-Tracking-Software

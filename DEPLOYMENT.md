# Deployment Guide

This project is deployed with:
- Frontend: Vercel (Next.js app in frontend)
- Backend: Render (Express app in backend)

## 1) Deploy Backend to Render

### Option A: Blueprint (recommended)
1. Push your code to GitHub.
2. In Render, choose New and then Blueprint.
3. Select your repository.
4. Render will detect render.yaml and propose the campusflow-backend service.
5. Add all required environment variables from backend/.env.example.
6. Deploy and copy the backend URL, for example:
   - https://campusflow-backend.onrender.com

### Option B: Manual Web Service
1. In Render, create a new Web Service.
2. Connect your repository.
3. Set Root Directory to backend.
4. Set Build Command to npm install.
5. Set Start Command to npm start.
6. Set Health Check Path to /api/health.
7. Add environment variables from backend/.env.example.

## 2) Deploy Frontend to Vercel

1. In Vercel, click Add New Project and import your repository.
2. Set Root Directory to frontend.
3. Keep framework as Next.js.
4. Add environment variables:
   - NEXT_PUBLIC_BACKEND_URL = your Render backend URL
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
5. Deploy.

## 3) Connect OAuth and CORS-related URLs

After both are deployed, update Render environment variables:
- FRONTEND_URL = your Vercel frontend URL
- GOOGLE_REDIRECT_URI = https://your-render-domain.onrender.com/api/auth/google/callback

In Google Cloud OAuth settings:
- Authorized redirect URI must include GOOGLE_REDIRECT_URI value.

## 4) Redeploy Sequence

When changing environment variables, redeploy in this order:
1. Backend on Render
2. Frontend on Vercel

## 5) Smoke Test

1. Open backend health endpoint:
   - https://your-render-domain.onrender.com/api/health
2. Open frontend on Vercel and test:
   - Login or signup
   - Task APIs loading
   - AI routes
   - Google connect flow (if configured)

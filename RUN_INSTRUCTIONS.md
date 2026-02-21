# AI Fitness Tracker — Run Instructions

## Prerequisites
- **Node.js 18+**
- **MongoDB** (or use the cloud URL already configured)

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Start the backend

```bash
cd backend
npm run dev
```

You should see:
```
MongoDB connected: aifintesstracker.7fzs014.mongodb.net
Server running on port 2333 in development mode
```

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Default Setup

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:2333
- **Health check:** http://localhost:2333/health

The frontend proxies `/api` to the backend when running locally (see `frontend/vite.config.js`).

---

## First-Time Use

1. Go to http://localhost:3000
2. Click **Register** and create an account
3. Sign in and start logging nutrition, activity, and sleep
4. Visit **AI Recommendations** for calorie/macro targets and food suggestions

---

## Making Changes

| Change | Location |
|--------|----------|
| API port | `backend/.env` → `PORT` |
| MongoDB URL | `backend/.env` → `MONGODB_URI` |
| Gemini API key | `backend/.env` → `GEMINI_API_KEY` |
| JWT secret | `backend/.env` → `JWT_SECRET` |
| CORS allowed origin | `backend/.env` → `CORS_ORIGIN` |
| Frontend API URL | `frontend/.env` → `VITE_API_URL` |

---

## Run with Docker

```bash
# From project root
docker-compose up -d

# Frontend: http://localhost:3000
# Backend: http://localhost:2333
```

To use your cloud MongoDB with Docker, add to `docker-compose.yml` under `backend` environment:

```yaml
- MONGODB_URI=mongodb+srv://jashwanthrampedelli_db_user:yxKFUzcLjkMsUgf4@aifintesstracker.7fzs014.mongodb.net/ai-fitness-tracker?appName=AIfintesstracker
```

---

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET` (32+ random characters)
3. Set `CORS_ORIGIN` to your production frontend URL
4. Use environment variables; never commit `.env` to git

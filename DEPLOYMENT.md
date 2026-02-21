# AI Fitness Tracker — Deployment Guide

This guide walks you through deploying the AI Fitness Tracker to Git and production.

---

## Part 1: Git Setup and Version Control

### 1.1 Initialize Git (if not already)

```bash
cd /path/to/AI\ Fitness\ Tracker

# Initialize repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Fitness Tracker MERN stack"
```

### 1.2 Create `.gitignore` (verify it exists)

Ensure `.gitignore` includes:

```
node_modules/
.env
.env.local
.env.*.local
dist/
build/
logs/
*.log
.DS_Store
.idea/
.vscode/
coverage/
```

**Important:** Never commit `.env` files—they contain secrets.

### 1.3 Push to GitHub / GitLab / Azure Repos

**GitHub example:**

```bash
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-fitness-tracker.git

# Or with SSH:
git remote add origin git@github.com:YOUR_USERNAME/ai-fitness-tracker.git

# Push main branch
git branch -M main
git push -u origin main
```

**Azure DevOps example:**

```bash
git remote add origin https://dev.azure.com/YOUR_ORG/YOUR_PROJECT/_git/ai-fitness-tracker
git push -u origin main
```

### 1.4 Set Up Environment Secrets in CI/CD

Store these as **secrets** (not in code):

- `MONGODB_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `CORS_ORIGIN` (your production frontend URL)

---

## Part 2: Production Deployment Options

### Option A: Docker Compose (Self-Hosted / VPS)

**Prerequisites:** Docker and Docker Compose installed.

1. **Clone and configure:**

```bash
git clone https://github.com/YOUR_USERNAME/ai-fitness-tracker.git
cd ai-fitness-tracker
```

2. **Create `backend/.env`:**

```env
NODE_ENV=production
PORT=2333
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-fitness-tracker
JWT_SECRET=your-32-char-minimum-secret
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
CORS_ORIGIN=https://your-domain.com
```

3. **Update `docker-compose.yml` for production:**

- Set `CORS_ORIGIN` to your frontend URL.
- Use MongoDB Atlas (cloud) instead of local MongoDB for production:

```yaml
backend:
  environment:
    - MONGODB_URI=${MONGODB_URI}
    - CORS_ORIGIN=${CORS_ORIGIN}
```

4. **Run:**

```bash
docker-compose up -d
```

5. **Reverse proxy (Nginx/Caddy):** Point your domain to the Docker host and proxy `/api` to the backend.

---

### Option B: Frontend (Vercel) + Backend (Railway/Render)

#### Frontend on Vercel

1. Push code to GitHub.
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variables:**
   - `VITE_API_URL` = `https://your-backend.railway.app/api/v1` (or your backend URL)

#### Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Select your repo, set **Root Directory** to `backend`.
3. **Environment Variables:**
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `CORS_ORIGIN` = `https://your-app.vercel.app`

4. Railway will expose a public URL. Use it as `VITE_API_URL` in Vercel.

#### Backend on Render

1. Go to [render.com](https://render.com) → New Web Service.
2. Connect GitHub, select repo, set **Root Directory** to `backend`.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add environment variables as above.

---

### Option C: Azure (Azure App Service / Container Apps)

1. **Azure Container Registry:** Push Docker images.
2. **Azure App Service or Container Apps:** Deploy frontend and backend containers.
3. **MongoDB Atlas:** Use as database.
4. **Azure DevOps Pipeline:** Use `azure-pipelines.yml` in the repo for CI/CD.

See `azure-pipelines.yml` for the pipeline configuration.

---

## Part 3: Environment Variables Checklist

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (use Atlas for production) |
| `JWT_SECRET` | Yes | Min 32 characters, random string |
| `GEMINI_API_KEY` | Yes | From [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `GEMINI_MODEL` | No | Default: `gemini-2.5-flash-lite` |
| `CORS_ORIGIN` | Yes (prod) | Your frontend URL, e.g. `https://app.example.com` |
| `VITE_API_URL` | Yes (prod) | Full backend API URL, e.g. `https://api.example.com/api/v1` |

---

## Part 4: Pre-Deployment Checklist

- [ ] All secrets in environment variables, not in code
- [ ] `CORS_ORIGIN` set to production frontend URL
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or your deployer IPs)
- [ ] Frontend `VITE_API_URL` points to production backend
- [ ] HTTPS enabled (most platforms provide this)
- [ ] Test login, signup, and AI features in production

---

## Part 5: Post-Deployment

1. **Health check:** `GET https://your-backend.com/health` should return `{"status":"ok"}`.
2. **Register a test user** and verify flows.
3. **Monitor logs** for errors (Railway, Render, Azure all provide log viewers).

---

## Quick Reference: Local vs Production

| Item | Local | Production |
|------|-------|------------|
| Frontend URL | http://localhost:3000 | https://your-app.vercel.app |
| Backend URL | http://localhost:2333 | https://api.your-domain.com |
| CORS_ORIGIN | http://localhost:3000 | https://your-app.vercel.app |
| VITE_API_URL | /api/v1 (proxy) | https://api.your-domain.com/api/v1 |

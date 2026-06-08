# CodeInsight AI - Production Deployment Guide

Complete step-by-step guide for deploying CodeInsight AI to production.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Vercel     │    │   Render     │    │      Railway         │  │
│  │              │    │              │    │                      │  │
│  │  React App   │───▶│  Node.js API │───▶│  Python AI Service   │  │
│  │  (Frontend)  │    │  (Backend)   │    │  (FastAPI + OpenAI)  │  │
│  │              │    │              │    │                      │  │
│  └──────────────┘    └──────┬───────┘    └──────────────────────┘  │
│                             │                                        │
│                             ▼                                        │
│                    ┌──────────────┐                                 │
│                    │ MongoDB Atlas│                                 │
│                    │  (Database)  │                                 │
│                    └──────────────┘                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Reference

| Service | Platform | Directory | URL Pattern |
|---------|----------|-----------|-------------|
| Frontend | Vercel | `client/` | `your-app.vercel.app` |
| Backend | Render | `server/` | `your-api.onrender.com` |
| AI Service | Railway | `ai-service/` | `your-service.up.railway.app` |
| Database | MongoDB Atlas | - | `cluster.mongodb.net` |

---

## Environment Variables Quick Setup

### Frontend (Vercel)

```env
VITE_API_URL=https://codeinsight-api.onrender.com
VITE_AI_SERVICE_URL=https://codeinsight-ai.up.railway.app
```

### Backend (Render)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codeinsight
JWT_SECRET=<generate-32-char-secret>
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=https://codeinsight-ai.up.railway.app
FRONTEND_URL=https://codeinsight.vercel.app
CORS_ORIGINS=https://codeinsight.vercel.app
```

### AI Service (Railway)

```env
ENVIRONMENT=production
PORT=8000
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4-turbo-preview
CORS_ORIGINS=https://codeinsight.vercel.app,https://codeinsight-api.onrender.com
```

---

## Step 1: MongoDB Atlas

### 1.1 Create Cluster

1. Sign up at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create cluster: **M0 Free** or **M10+ for production**
3. Region: Choose closest to your users

### 1.2 Security Configuration

**Database User:**
```
Username: codeinsight_admin
Password: <secure-password>
Privileges: Read and write to any database
```

**Network Access:**
- Add `0.0.0.0/0` for all IPs (simplest)
- Or add specific Render/Railway IP ranges

### 1.3 Connection String

```
mongodb+srv://codeinsight_admin:<password>@cluster.mongodb.net/codeinsight?retryWrites=true&w=majority
```

---

## Step 2: Railway (AI Service)

### 2.1 Deploy

1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Select repository
4. Set **Root Directory**: `ai-service`

### 2.2 Environment Variables

| Key | Value |
|-----|-------|
| `ENVIRONMENT` | `production` |
| `PORT` | `8000` |
| `DEBUG` | `false` |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4-turbo-preview` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `LOG_LEVEL` | `INFO` |

### 2.3 Generate Domain

Settings → Networking → Generate Domain

**Verify:**
```bash
curl https://your-service.up.railway.app/health
```

---

## Step 3: Render (Backend)

### 3.1 Deploy

1. Go to [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repository
4. Settings:
   - **Name**: `codeinsight-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm ci`
   - **Start Command**: `node src/app.js`

### 3.2 Environment Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | `<openssl rand -hex 32>` |
| `JWT_EXPIRES_IN` | `7d` |
| `AI_SERVICE_URL` | `https://your-service.up.railway.app` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |

**Verify:**
```bash
curl https://codeinsight-api.onrender.com/health
```

---

## Step 4: Vercel (Frontend)

### 4.1 Deploy

1. Go to [vercel.com](https://vercel.com)
2. **New Project** → Import repository
3. Settings:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.2 Environment Variables

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://codeinsight-api.onrender.com` |
| `VITE_AI_SERVICE_URL` | `https://your-service.up.railway.app` |

### 4.3 Update CORS

After getting frontend URL, update CORS in:
- Railway: Add to `CORS_ORIGINS`
- Render: Add to `CORS_ORIGINS` and `FRONTEND_URL`

---

## Configuration Files

### `client/vercel.json`

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### `server/render.yaml`

```yaml
services:
  - type: web
    name: codeinsight-api
    runtime: node
    buildCommand: npm ci
    startCommand: node src/app.js
    healthCheckPath: /health
```

### `ai-service/railway.toml`

```toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "on_failure"
```

---

## Docker Compose (Local Production Test)

```bash
cd docker
docker-compose -f docker-compose.prod.yml up --build
```

Required `.env` file:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-...
```

---

## Troubleshooting

### CORS Errors

```js
// Check CORS_ORIGINS includes exact frontend URL without trailing slash
CORS_ORIGINS=https://your-app.vercel.app
// ✓ Correct

CORS_ORIGINS=https://your-app.vercel.app/
// ✗ Wrong (trailing slash)
```

### MongoDB Connection Fails

1. Check IP whitelist includes `0.0.0.0/0` or service IPs
2. URL encode special characters in password
3. Test connection string locally first

### Railway Build Fails

1. Check `requirements.txt` for typos
2. Ensure `Dockerfile` exists in `ai-service/`
3. Review build logs in Railway dashboard

### Render Cold Starts

Free tier sleeps after 15 minutes of inactivity. First request may take 30+ seconds.

**Solutions:**
- Upgrade to paid plan ($7/month)
- Use external ping service to keep warm
- Implement loading state in frontend

---

## Security Checklist

- [ ] Generate strong JWT secret: `openssl rand -hex 32`
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS origins (not `*`)
- [ ] Enable rate limiting
- [ ] Set up MongoDB IP whitelist
- [ ] Use environment variables (never commit secrets)
- [ ] Enable HTTPS only
- [ ] Set up error monitoring (Sentry)

---

## Cost Summary

| Service | Free Tier | Starter Plan |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth | $20/mo |
| Render | 750 hrs, sleeps | $7/mo |
| Railway | $5 credit/mo | $5+/mo |
| MongoDB | 512MB | $57/mo (M10) |

**Production Estimate:** ~$90/month

---

## Monitoring

### Logs

```bash
# Vercel
vercel logs

# Render
# Dashboard → Service → Logs

# Railway  
# Dashboard → Service → Logs
```

### Health Checks

```bash
# All services
curl https://your-app.vercel.app
curl https://your-api.onrender.com/health
curl https://your-ai.up.railway.app/health
```

### Uptime Monitoring

Consider using:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Better Uptime](https://betteruptime.com)
- [Checkly](https://www.checklyhq.com)

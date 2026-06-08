# CodeInsight AI - Deployment Guide

## Overview

This guide covers deploying CodeInsight AI to production using:
- **Frontend**: Vercel
- **Node.js Backend**: Render
- **Python AI Service**: Railway
- **Database**: MongoDB Atlas

---

## Prerequisites

1. GitHub account with repository access
2. Accounts on Vercel, Render, Railway, and MongoDB Atlas
3. OpenAI API key
4. Domain name (optional)

---

## 1. MongoDB Atlas Setup

### Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (M0 Free tier works for development)
3. Configure network access:
   - Add IP `0.0.0.0/0` for any IP access (or specific IPs for security)
4. Create a database user with read/write permissions
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/codeinsight?retryWrites=true&w=majority
   ```

---

## 2. Python AI Service (Railway)

### Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Create a new project → "Deploy from GitHub repo"
3. Select your repository
4. Set the root directory to `ai-service`

### Configure Environment Variables

```
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview
DEBUG=false
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://your-backend.onrender.com
```

### Deployment Settings

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Get Your Service URL

After deployment, Railway will provide a URL like:
```
https://codeinsight-ai-service.up.railway.app
```

---

## 3. Node.js Backend (Render)

### Deploy to Render

1. Go to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the root directory to `server`

### Build & Start Commands

- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/codeinsight?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-random-string-at-least-32-chars
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=https://codeinsight-ai-service.up.railway.app
CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Get Your Service URL

After deployment, Render will provide a URL like:
```
https://codeinsight-api.onrender.com
```

---

## 4. React Frontend (Vercel)

### Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set the root directory to `client`

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables

```
VITE_API_URL=https://codeinsight-api.onrender.com/api
VITE_APP_NAME=CodeInsight AI
```

### Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Configure DNS records as instructed

---

## 5. Post-Deployment Verification

### Health Checks

1. **AI Service**: `GET https://your-ai-service.railway.app/health`
2. **Backend**: `GET https://your-backend.onrender.com/health`
3. **Frontend**: Visit your Vercel URL

### Test API Flow

```bash
# Test registration
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'

# Test code analysis
curl -X POST https://your-backend.onrender.com/api/analysis/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code":"print(\"hello\")","language":"python"}'
```

---

## 6. CI/CD Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install & Test Client
        run: |
          cd client
          npm ci
          npm run lint
      
      - name: Install & Test Server
        run: |
          cd server
          npm ci
          npm run lint

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Test AI Service
        run: |
          cd ai-service
          pip install -r requirements.txt
          pytest
```

---

## 7. Monitoring & Logging

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Logging**: LogDNA, Papertrail
- **APM**: New Relic, Datadog

### Sentry Setup (Example)

1. Create Sentry project
2. Install SDK in each service
3. Configure DSN in environment variables

---

## 8. Scaling Considerations

### Frontend (Vercel)
- Automatically scales with Edge Network
- Enable Analytics for performance monitoring

### Backend (Render)
- Start with 512MB RAM
- Monitor and upgrade as needed
- Consider auto-scaling for higher tiers

### AI Service (Railway)
- Monitor response times
- Consider caching for repeated analyses
- Scale horizontally if needed

### Database (MongoDB Atlas)
- Start with M0/M10 for development
- Enable Performance Advisor
- Set up indexes for frequently queried fields

---

## 9. Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Secure JWT secret (32+ random characters)
- [ ] Enable rate limiting
- [ ] Set proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Regular dependency updates
- [ ] Enable 2FA on all platforms

---

## 10. Troubleshooting

### Common Issues

**CORS Errors**
- Verify CORS_ORIGIN matches your frontend URL exactly
- Check for trailing slashes

**MongoDB Connection Fails**
- Verify IP whitelist includes `0.0.0.0/0` or specific IPs
- Check username/password in connection string
- Ensure database user has correct permissions

**AI Service Timeouts**
- Increase timeout settings
- Check OpenAI API key is valid
- Monitor rate limits

**Build Failures**
- Check Node.js/Python versions match requirements
- Verify all dependencies are listed in package.json/requirements.txt

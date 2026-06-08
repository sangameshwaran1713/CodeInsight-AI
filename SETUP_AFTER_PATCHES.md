# Setup Guide After Security Patches

## Quick Start

Follow these steps to get your secured CodeInsight AI project running:

### Step 1: Generate Secure Secrets

```bash
node scripts/generate-secrets.js
```

This will generate:
- JWT_SECRET (128 characters)
- SESSION_SECRET (128 characters)

Copy these values - you'll need them in the next step.

### Step 2: Configure Environment Variables

#### Server Configuration (`server/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB - REPLACE WITH YOUR CONNECTION STRING
MONGODB_URI=mongodb://localhost:27017/codeinsight
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codeinsight?retryWrites=true&w=majority

# JWT - PASTE YOUR GENERATED SECRET HERE
JWT_SECRET=<paste-generated-jwt-secret-here>
JWT_EXPIRES_IN=7d

# AI Service
AI_SERVICE_URL=http://localhost:8000

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5

# Email Configuration - USE APP-SPECIFIC PASSWORD
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=CodeInsight AI <your-email@gmail.com>
FRONTEND_URL=http://localhost:3000

# Session Secret - PASTE YOUR GENERATED SECRET HERE
SESSION_SECRET=<paste-generated-session-secret-here>
```

#### AI Service Configuration (`ai-service/.env`)

```env
# AI Service Configuration
DEBUG=true
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
ENVIRONMENT=development

# AI Provider - Choose "ollama" (free, local) or "openai" (paid)
AI_PROVIDER=ollama

# Ollama Settings (if using)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# OpenAI Settings (if using)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TIMEOUT=30

# GitHub Token (optional)
GITHUB_TOKEN=

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# CORS
CORS_ORIGINS_STR=http://localhost:3000,http://localhost:5000

# Request Timeout
REQUEST_TIMEOUT=30
```

#### Client Configuration (`client/.env`)

Already configured! ✅

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CodeInsight AI
```

### Step 3: Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install

# Python dependencies
cd ../ai-service
pip install -r requirements.txt
```

### Step 4: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `server/.env`

### Step 5: Set Up Email (Optional)

For password reset and email verification:

1. **Gmail Setup**:
   - Go to Google Account settings
   - Enable 2-Factor Authentication
   - Generate an App Password
   - Use the app password in `SMTP_PASS`

2. **Update `.env`**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Step 6: Set Up AI Provider

**Option A: Ollama (Free, Local)**
```bash
# Install Ollama
# Visit: https://ollama.com/download

# Pull a model
ollama pull llama3.2

# Verify it's running
curl http://localhost:11434/api/tags
```

**Option B: OpenAI (Paid)**
1. Get API key from https://platform.openai.com/api-keys
2. Update `OPENAI_API_KEY` in `ai-service/.env`
3. Set `AI_PROVIDER=openai`

### Step 7: Start the Application

**Option 1: All Services at Once**
```bash
npm start
```

**Option 2: Individual Services**
```bash
# Terminal 1 - AI Service
cd ai-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2 - Backend Server
cd server
npm run dev

# Terminal 3 - Frontend Client
cd client
npm run dev
```

**Option 3: Windows Batch Script**
```bash
start-all.bat
```

### Step 8: Verify Everything Works

1. **Check Services**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000/health (requires login after patches)
   - AI Service: http://localhost:8000/health

2. **Test Registration**:
   - Go to http://localhost:3000
   - Click "Register"
   - Try weak password (should fail)
   - Use strong password: `SecurePass123!`
   - Should succeed ✅

3. **Test Rate Limiting**:
   - Try logging in with wrong password 6 times
   - Should be blocked after 5 attempts ✅

## Security Checklist

Before you start coding:

- [ ] Generated secure JWT_SECRET
- [ ] Generated secure SESSION_SECRET
- [ ] Updated MongoDB connection string
- [ ] Configured email (if needed)
- [ ] Set up AI provider (Ollama or OpenAI)
- [ ] Verified all services start successfully
- [ ] Tested user registration with strong password
- [ ] Confirmed rate limiting works
- [ ] Read `docs/SECURITY.md`

## Common Issues

### Issue: "JWT_SECRET is not defined"
**Solution**: Make sure you generated and added JWT_SECRET to `server/.env`

### Issue: "Cannot connect to MongoDB"
**Solution**: 
- Check MongoDB is running: `mongod`
- Verify connection string in `server/.env`
- For Atlas, check IP whitelist

### Issue: "OpenAI API error"
**Solution**:
- Verify API key is correct
- Check you have credits
- Or switch to Ollama: `AI_PROVIDER=ollama`

### Issue: "Ollama not found"
**Solution**:
- Install Ollama from https://ollama.com/download
- Pull a model: `ollama pull llama3.2`
- Verify: `ollama list`

### Issue: "Rate limit error immediately"
**Solution**: 
- Clear rate limit: restart server
- Or increase limit in `.env`: `AUTH_RATE_LIMIT_MAX=10`

### Issue: "Password too weak"
**Solution**: Use at least 12 characters with uppercase, lowercase, numbers, and special characters
- ❌ `password123`
- ❌ `Password123`
- ✅ `SecurePass123!`

## Development vs Production

### Development (Current Setup)
- Uses local MongoDB or Atlas free tier
- Debug logging enabled
- CORS allows localhost
- Health endpoints accessible
- Detailed error messages

### Production (When Deploying)
- Set `NODE_ENV=production`
- Use production MongoDB cluster
- Disable debug logging
- Restrict CORS to your domain
- Health endpoints require auth
- Generic error messages
- Enable HTTPS
- Use secrets manager
- Set up monitoring

See `docs/SECURITY.md` for full production checklist.

## Next Steps

1. **Read Documentation**:
   - `SECURITY_PATCHES.md` - What was fixed
   - `docs/SECURITY.md` - Security best practices
   - `docs/API.md` - API documentation
   - `docs/ARCHITECTURE.md` - System architecture

2. **Test the Application**:
   - Create an account
   - Analyze some code
   - Try different analysis types
   - Test the playground

3. **Customize**:
   - Update branding
   - Modify analysis prompts
   - Add new features
   - Integrate with your tools

4. **Deploy** (when ready):
   - Follow `docs/DEPLOYMENT.md`
   - Use production secrets
   - Enable monitoring
   - Set up backups

## Support

Need help?
- Check `docs/` folder for detailed guides
- Review `SECURITY_PATCHES.md` for what changed
- Open an issue on GitHub
- Email: support@yourdomain.com

## Security

Found a security issue?
- **DO NOT** create a public issue
- Email: security@yourdomain.com
- See `docs/SECURITY.md` for details

---

**You're all set!** 🚀

Your CodeInsight AI project is now secured and ready to use.

Happy coding! 💻

# 🚀 ECHO Deployment Guide - Share with Friends!

This guide shows you how to deploy ECHO so your friends can use it without installing anything locally.

## 🎯 Goal: Shareable ECHO

After deployment, your friends can:

- ✅ Use ECHO's AI features without installing Ollama
- ✅ Access it from any device with a web browser
- ✅ Get the full ECHO experience instantly

## 🌐 Step 1: Setup Cloud AI (FREE)

ECHO uses free cloud AI APIs so it works for everyone:

### Option A: Groq (Recommended - Very Fast)

1. Go to: https://console.groq.com/
2. Sign up (free account)
3. Create an API key
4. Add to your `.env`: `GROQ_API_KEY=your_key_here`

### Option B: OpenRouter (Good Free Tier)

1. Go to: https://openrouter.ai/
2. Sign up (free account)
3. Get API key from dashboard
4. Add to your `.env`: `OPENROUTER_API_KEY=your_key_here`

### Option C: Hugging Face (Free)

1. Go to: https://huggingface.co/
2. Sign up (free account)
3. Go to Settings > Access Tokens
4. Create a token
5. Add to your `.env`: `HUGGINGFACE_API_KEY=your_key_here`

### Test Your Setup

```bash
cd Echo/backend
python setup_cloud_ai.py
```

## 🗄️ Step 2: Production Database

For deployment, use PostgreSQL (not SQLite):

### Update your `.env`:

```env
USE_SQLITE=false
POSTGRES_SERVER=your_db_host
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=echo_db
POSTGRES_PORT=5432
```

### Free PostgreSQL Options:

- **Railway**: Includes free PostgreSQL
- **Render**: Free PostgreSQL tier
- **Supabase**: Free PostgreSQL with dashboard
- **ElephantSQL**: Free PostgreSQL hosting

## 🌍 Step 3: Deploy to Cloud Platform

### Option A: Railway (Recommended)

1. **Connect GitHub:**

   - Push your ECHO code to GitHub
   - Go to https://railway.app/
   - Connect your GitHub repo

2. **Configure Environment:**

   ```env
   USE_CLOUD_AI=true
   GROQ_API_KEY=your_groq_key
   POSTGRES_SERVER=your_railway_db_host
   POSTGRES_USER=your_railway_db_user
   POSTGRES_PASSWORD=your_railway_db_password
   POSTGRES_DB=railway
   ```

3. **Deploy:**
   - Railway auto-deploys from GitHub
   - Get your public URL
   - Share with friends! 🎉

### Option B: Render

1. **Connect GitHub:**

   - Go to https://render.com/
   - Create new Web Service
   - Connect your GitHub repo

2. **Configure:**

   - Build Command: `cd Echo/backend && pip install -r requirements.txt`
   - Start Command: `cd Echo/backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables

3. **Frontend:**
   - Create separate Static Site for frontend
   - Build Command: `cd Echo/echo-frontend-interface && npm install && npm run build`
   - Publish Directory: `Echo/echo-frontend-interface/dist`

### Option C: Vercel + Railway

1. **Backend on Railway:**

   - Deploy backend API to Railway
   - Get API URL

2. **Frontend on Vercel:**
   - Deploy frontend to Vercel
   - Update API URL in frontend config
   - Get public URL

## ⚙️ Step 4: Production Configuration

### Update CORS Origins

In `Echo/backend/app/core/config.py`:

```python
BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-deployed-frontend.vercel.app",  # Add your domain
    "https://your-custom-domain.com",  # Add custom domain
]
```

### Environment Variables Checklist

```env
# AI Configuration
USE_CLOUD_AI=true
GROQ_API_KEY=your_groq_key

# Database
USE_SQLITE=false
POSTGRES_SERVER=your_db_host
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=echo_db

# Security
SECRET_KEY=your_secure_secret_key

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🧪 Step 5: Test Deployment

1. **Test AI:**

   ```bash
   curl -X POST "https://your-api-url/api/v1/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello ECHO!"}'
   ```

2. **Test Frontend:**
   - Visit your deployed URL
   - Try creating tasks
   - Test chat functionality
   - Verify AI responses work

## 📱 Step 6: Share with Friends!

Send your friends:

- 🔗 **Your deployed URL**
- 📝 **Quick start guide:**

  ```
  🎯 Welcome to ECHO - Your AI Productivity Assistant!

  ✨ What you can do:
  • Create and manage tasks
  • Track daily habits
  • Chat with AI for productivity advice
  • View analytics and insights
  • Integrate with Google Calendar

  🚀 Just start using it - no installation needed!
  ```

## 🔧 Troubleshooting

### AI Not Working for Users

- ✅ Check cloud AI API keys are set
- ✅ Run `python setup_cloud_ai.py` to test
- ✅ Check API quotas/limits

### Database Issues

- ✅ Verify PostgreSQL connection
- ✅ Run migrations: `alembic upgrade head`
- ✅ Check database credentials

### CORS Errors

- ✅ Add your domain to CORS origins
- ✅ Redeploy after config changes

### Performance Issues

- ✅ Use cloud AI for better performance
- ✅ Enable database connection pooling
- ✅ Add caching for analytics

## 💡 Pro Tips

1. **Custom Domain:** Use a custom domain for professional look
2. **SSL Certificate:** Most platforms provide free SSL
3. **Monitoring:** Set up uptime monitoring
4. **Backups:** Regular database backups
5. **Updates:** Set up auto-deploy from GitHub

## 🎉 Success!

Once deployed, your ECHO will:

- ✅ Work for anyone with internet access
- ✅ Provide AI responses without local setup
- ✅ Scale to handle multiple users
- ✅ Be accessible from any device

Your friends can now enjoy ECHO's full AI-powered productivity features! 🚀

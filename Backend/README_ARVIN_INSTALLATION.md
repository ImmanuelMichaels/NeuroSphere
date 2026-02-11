# ARVIN Chatbot - Complete Installation Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.9 or higher
- Node.js 16+ (for React frontend)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

---

## 📦 Backend Setup (Flask API)

### 1. Create Python Virtual Environment
```bash
# Navigate to your project directory
cd neuropulse-app

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Anthropic API key
# Use nano, vim, or any text editor:
nano .env
```

**Add your API key:**
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### 4. Download NLTK Data
```bash
python -c "import nltk; nltk.download('vader_lexicon')"
```

### 5. Run the Backend Server
```bash
python arvin_backend.py
```

The server will start on `http://localhost:5000`

✅ **Test the API:**
```bash
curl http://localhost:5000/api/arvin/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "ARVIN Chatbot API",
  "version": "1.0.0"
}
```

---

## 🎨 Frontend Setup (React)

### 1. Navigate to Your React App
```bash
cd src
```

### 2. Add ArvinChatbot Component
Copy `ArvinChatbot.jsx` to:
```
src/pages/Mental/ArvinChatbot.jsx
```

### 3. Update Your Routes
In `src/App.jsx` or `src/routes/AppRoutes.jsx`:

```jsx
import ArvinChatbot from './pages/Mental/ArvinChatbot';

// Add to your routes:
<Route 
    path="/arvin-chatbot" 
    element={
        <ProtectedRoute>
            <ArvinChatbot />
        </ProtectedRoute>
    } 
/>
```

### 4. Add to Navigation Menu
In `src/utils/constants/routes.js`:

```javascript
export const MENTAL_HEALTH_ROUTES = {
    // ... existing routes
    ARVIN_CHATBOT: '/arvin-chatbot'
};
```

In your navigation component:
```jsx
<a href="/arvin-chatbot">ARVIN AI Companion</a>
```

### 5. Configure API URL
Add to your `.env` file (frontend):
```
REACT_APP_ARVIN_API_URL=http://localhost:5000
```

For production:
```
REACT_APP_ARVIN_API_URL=https://your-backend-url.com
```

### 6. Start React App
```bash
npm start
```

---

## 🌐 Production Deployment

### Option 1: Deploying to Heroku

#### Backend (Flask):
```bash
# Install Heroku CLI
# Then:
heroku login
heroku create neuropulse-arvin-api

# Set environment variables
heroku config:set ANTHROPIC_API_KEY=your_key_here

# Create Procfile
echo "web: gunicorn arvin_backend:app" > Procfile

# Deploy
git add .
git commit -m "Deploy ARVIN backend"
git push heroku main
```

#### Frontend (React):
Deploy to Vercel, Netlify, or include in your existing React deployment.

Update `REACT_APP_ARVIN_API_URL` to your Heroku backend URL.

### Option 2: Deploying to AWS/DigitalOcean

#### Backend:
1. Set up an Ubuntu server
2. Install Python 3.9+
3. Clone your repository
4. Install dependencies: `pip install -r requirements.txt`
5. Set up Nginx reverse proxy
6. Use systemd to run Flask as a service
7. Configure SSL with Let's Encrypt

#### Frontend:
Build and serve static files:
```bash
npm run build
# Serve the build folder with Nginx or your preferred server
```

---

## 🔒 Security Best Practices

### 1. API Key Security
- ✅ Never commit `.env` to Git
- ✅ Use environment variables
- ✅ Rotate API keys regularly
- ✅ Use separate keys for development/production

### 2. CORS Configuration
Update in `arvin_backend.py`:
```python
# For production, specify exact origins:
CORS(app, origins=["https://your-frontend-domain.com"])
```

### 3. Rate Limiting (Recommended)
Install Flask-Limiter:
```bash
pip install Flask-Limiter
```

Add to backend:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/arvin/chat', methods=['POST'])
@limiter.limit("20 per minute")
def chat():
    # ... existing code
```

### 4. HTTPS Only
Always use HTTPS in production. Never send API keys over HTTP.

---

## 🧪 Testing the Integration

### 1. Backend Health Check
```bash
curl http://localhost:5000/api/arvin/health
```

### 2. Test Chat Endpoint
```bash
curl -X POST http://localhost:5000/api/arvin/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am feeling anxious today",
    "user_id": "test_user"
  }'
```

### 3. Test Crisis Detection
```bash
curl -X POST http://localhost:5000/api/arvin/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to end it all",
    "user_id": "test_user"
  }'
```

You should receive crisis hotline information.

### 4. Frontend Testing
1. Navigate to `http://localhost:3000/arvin-chatbot`
2. Send a test message: "Hello ARVIN"
3. Verify response appears
4. Test crisis detection with keyword
5. Check sentiment indicators
6. Clear session and verify

---

## 📁 File Structure

```
neuropulse-app/
├── backend/
│   ├── arvin_backend.py          # Flask API server
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables (DO NOT COMMIT)
│   ├── .env.example              # Template for .env
│   └── venv/                      # Virtual environment
│
├── src/
│   ├── pages/
│   │   └── Mental/
│   │       └── ArvinChatbot.jsx  # React component
│   ├── utils/
│   │   └── constants/
│   │       └── routes.js         # Add ARVIN route
│   └── App.jsx                    # Add route
│
└── README_ARVIN.md                # This file
```

---

## 🐛 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not found"
**Solution:** 
- Check `.env` file exists in backend directory
- Verify API key is correct
- Restart Flask server after adding key

### Issue: CORS errors in browser
**Solution:**
- Check CORS is enabled in `arvin_backend.py`
- Verify frontend URL matches CORS configuration
- Clear browser cache

### Issue: "Connection refused" from frontend
**Solution:**
- Ensure Flask backend is running on port 5000
- Check `REACT_APP_ARVIN_API_URL` in frontend `.env`
- Verify firewall isn't blocking port 5000

### Issue: NLTK data not found
**Solution:**
```bash
python -c "import nltk; nltk.download('vader_lexicon')"
```

### Issue: Messages not appearing
**Solution:**
- Open browser DevTools → Console
- Check for JavaScript errors
- Verify API responses in Network tab
- Check Flask server logs

---

## 💡 Usage Tips

### For Users:
1. **Be specific:** "I'm having manic symptoms" works better than "I feel weird"
2. **Context matters:** ARVIN remembers your conversation (in-session)
3. **Crisis help:** ARVIN detects crisis keywords and provides immediate resources
4. **Privacy:** Conversations are NOT saved between sessions

### For Developers:
1. **Session management:** Currently in-memory. For production, use Redis or PostgreSQL
2. **Scaling:** Consider load balancing for high traffic
3. **Monitoring:** Add logging and error tracking (Sentry, LogRocket)
4. **Customization:** Edit `SYSTEM_PROMPT` in `arvin_backend.py` to adjust behavior

---

## 📊 API Endpoints Reference

### GET /api/arvin/health
Health check endpoint
```bash
curl http://localhost:5000/api/arvin/health
```

### POST /api/arvin/chat
Send message to ARVIN
```bash
curl -X POST http://localhost:5000/api/arvin/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_id": "user123"}'
```

### POST /api/arvin/clear-session
Clear conversation history
```bash
curl -X POST http://localhost:5000/api/arvin/clear-session \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

### POST /api/arvin/session-stats
Get session statistics
```bash
curl -X POST http://localhost:5000/api/arvin/session-stats \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

### GET /api/arvin/resources
Get mental health resources
```bash
curl http://localhost:5000/api/arvin/resources
```

---

## 🎯 Next Steps

1. ✅ Install backend dependencies
2. ✅ Configure environment variables
3. ✅ Run Flask server
4. ✅ Add React component to your app
5. ✅ Test the integration
6. ✅ Deploy to production
7. ⏭️ Add session persistence (Redis/PostgreSQL)
8. ⏭️ Implement user authentication
9. ⏭️ Add conversation export feature
10. ⏭️ Set up monitoring and logging

---

## 📞 Support & Resources

- **Anthropic API Docs:** https://docs.anthropic.com/
- **Flask Documentation:** https://flask.palletsprojects.com/
- **React Documentation:** https://react.dev/

**Emergency Mental Health Resources:**
- Nigeria: 09010000000 (Mentally Aware Nigeria Initiative)
- Global: 988 (Suicide & Crisis Lifeline)
- Emergency: 112 (Nigeria)

---

## ⚠️ Important Disclaimers

1. **Not Medical Advice:** ARVIN is a support tool, NOT a replacement for professional mental health care
2. **Crisis Situations:** Always direct users to emergency services
3. **Data Privacy:** Implement proper data protection in production
4. **Liability:** Users should consult licensed professionals for medical decisions
5. **Monitoring Required:** Review conversations periodically for safety

---

**ARVIN is designed to support, not replace, professional mental health care. Always prioritize user safety.** 💚

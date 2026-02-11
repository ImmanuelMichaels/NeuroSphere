# 🤖 ARVIN - AI Mental Health Chatbot
## Complete Integration Package for NeuroPulse Platform

---

## 📦 What's Included

This package contains everything you need to integrate ARVIN AI chatbot into your NeuroPulse application:

### Backend (Python/Flask)
- ✅ **arvin_backend.py** - Complete Flask API server with Anthropic Claude integration
- ✅ **requirements.txt** - All Python dependencies
- ✅ **.env.example** - Environment variable template
- ✅ **setup.sh** - Automated installation script

### Frontend (React)
- ✅ **ArvinChatbot.jsx** - Beautiful React component with neuro-affirming design

### Documentation
- ✅ **README_ARVIN_INSTALLATION.md** - Comprehensive setup guide
- ✅ **This README** - Quick start instructions

---

## ⚡ Super Quick Start (5 Minutes)

### 1. Extract Files
```bash
tar -xzf arvin-chatbot-complete.tar.gz
cd arvin-chatbot
```

### 2. Run Automated Setup
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Add Your API Key
```bash
# Edit .env file
nano .env

# Add this line:
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

Get your API key from: https://console.anthropic.com/

### 4. Start Backend
```bash
source venv/bin/activate
python arvin_backend.py
```

Backend will run on `http://localhost:5000`

### 5. Integrate Frontend
Copy `ArvinChatbot.jsx` to your React app:
```bash
cp ArvinChatbot.jsx /path/to/your/neuropulse-app/src/pages/Mental/
```

Add to your routes in `App.jsx`:
```jsx
import ArvinChatbot from './pages/Mental/ArvinChatbot';

<Route path="/arvin-chatbot" element={<ArvinChatbot />} />
```

Add to `.env` (frontend):
```
REACT_APP_ARVIN_API_URL=http://localhost:5000
```

### 6. Test It!
1. Start your React app: `npm start`
2. Navigate to: `http://localhost:3000/arvin-chatbot`
3. Send a message: "Hello ARVIN"

---

## 🎯 Key Features

### Safety-First Design
- ✅ **Crisis Detection**: Automatically detects suicide/self-harm keywords
- ✅ **Immediate Escalation**: Provides Nigerian (09010000000) and global (988) hotlines
- ✅ **Disclaimers**: Every response includes "I'm an AI tool, not a doctor"
- ✅ **No Medical Advice**: Only evidence-based coping strategies

### Multi-Condition Support
1. **Bipolar Disorder**: Mood tracking, episode management, stability routines
2. **Autism**: Sensory regulation, routine planning, communication strategies
3. **Gambling/Betting Addiction**: Urge logging, distraction techniques, accountability
4. **General Mental Health**: CBT techniques, anxiety/depression coping

### Intelligent Responses
- ✅ **Chain-of-Thought**: Claude analyzes mood, condition, and context before responding
- ✅ **Sentiment Analysis**: NLTK VADER detects user mood (positive/neutral/negative)
- ✅ **Contextual Humor**: Light humor only when appropriate (never during crisis)
- ✅ **Conversation History**: Maintains context across 10 messages

### Cultural Relevance
- ✅ Nigerian crisis hotlines
- ✅ African artist recommendations (Burna Boy, Wizkid, Asa, Tems)
- ✅ Local comedy content (Basket Mouth, Mark Angel Comedy)
- ✅ Culturally sensitive, warm language

### Beautiful Design
- ✅ Neuro-affirming soft colors (sage green #6b8e7f, terra cotta #d4a574)
- ✅ Large touch targets (52-60px buttons)
- ✅ Accessible fonts (Atkinson Hyperlegible, Lexend)
- ✅ Sentiment indicators on messages
- ✅ Crisis banner for urgent situations

---

## 📊 API Endpoints

### Health Check
```bash
GET /api/arvin/health
```

### Send Message
```bash
POST /api/arvin/chat
Body: { "message": "string", "user_id": "string" }
```

### Clear Session
```bash
POST /api/arvin/clear-session
Body: { "user_id": "string" }
```

### Session Stats
```bash
POST /api/arvin/session-stats
Body: { "user_id": "string" }
```

### Get Resources
```bash
GET /api/arvin/resources
```

---

## 🧪 Testing Examples

### Test Normal Conversation
```bash
curl -X POST http://localhost:5000/api/arvin/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel anxious today", "user_id": "test"}'
```

### Test Crisis Detection
```bash
curl -X POST http://localhost:5000/api/arvin/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to end it all", "user_id": "test"}'
```

Expected: Crisis response with hotlines

### Test Music Recommendation
```bash
curl -X POST http://localhost:5000/api/arvin/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel low, can music help?", "user_id": "test"}'
```

---

## 🔒 Security Notes

1. **API Key Security**
   - Never commit `.env` to Git
   - Use environment variables
   - Rotate keys regularly

2. **CORS Configuration**
   - Update `CORS(app)` in `arvin_backend.py` for production
   - Specify exact frontend origins

3. **Rate Limiting** (Recommended)
   ```bash
   pip install Flask-Limiter
   ```

4. **Session Storage**
   - Current: In-memory (development only)
   - Production: Use Redis or PostgreSQL

---

## 🚀 Production Deployment

### Deploy Backend to Heroku
```bash
heroku create neuropulse-arvin
heroku config:set ANTHROPIC_API_KEY=your_key
echo "web: gunicorn arvin_backend:app" > Procfile
git push heroku main
```

### Update Frontend .env
```
REACT_APP_ARVIN_API_URL=https://neuropulse-arvin.herokuapp.com
```

---

## 📁 File Structure After Integration

```
neuropulse-app/
├── backend/                      # New: ARVIN backend
│   ├── arvin_backend.py
│   ├── requirements.txt
│   ├── .env
│   ├── setup.sh
│   └── venv/
│
├── src/
│   ├── pages/
│   │   └── Mental/
│   │       └── ArvinChatbot.jsx  # New: ARVIN component
│   ├── utils/
│   │   └── constants/
│   │       └── routes.js         # Add: ARVIN_CHATBOT route
│   └── App.jsx                    # Add: ARVIN route
│
└── ...existing files
```

---

## ⚠️ Important Disclaimers

1. **Not Medical Advice**: ARVIN is a support tool, NOT a replacement for therapists
2. **Crisis Situations**: Always escalate to human professionals
3. **Data Privacy**: Conversations stored in-session only (not persisted)
4. **User Safety**: Monitor usage and review conversations periodically
5. **Professional Consultation**: Users should see licensed professionals for diagnosis/treatment

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY not found"
- Check `.env` file exists
- Verify API key is correct
- Restart server after adding key

### CORS Errors
- Enable CORS in `arvin_backend.py`
- Check frontend URL matches CORS config
- Clear browser cache

### NLTK Data Not Found
```bash
python -c "import nltk; nltk.download('vader_lexicon')"
```

### Messages Not Appearing
- Check browser DevTools → Console
- Verify API running on port 5000
- Check `REACT_APP_ARVIN_API_URL` in frontend `.env`

---

## 📞 Emergency Resources

**Nigeria:**
- Mentally Aware Nigeria Initiative: 09010000000
- Emergency Services: 112

**Global:**
- Suicide & Crisis Lifeline: 988

**ARVIN is designed to support, not replace, professional mental health care.** 💚

---

## 📚 Full Documentation

For detailed installation instructions, API reference, deployment guides, and advanced configuration, see:

**README_ARVIN_INSTALLATION.md**

---

## 🎉 You're Ready!

Your ARVIN chatbot is now integrated into NeuroPulse. Start helping users with intelligent, compassionate AI support!

**Questions?** Check the full installation guide or the inline code comments.

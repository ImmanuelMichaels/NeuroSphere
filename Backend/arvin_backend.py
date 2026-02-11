"""
ARVIN Chatbot Backend API
Flask server with Anthropic Claude integration for mental health support
Installation: pip install flask flask-cors anthropic nltk python-dotenv
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import anthropic
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Download NLTK data
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
sia = SentimentIntensityAnalyzer()

# Session storage (in production, use Redis or database)
user_sessions = {}

# Crisis keywords
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end it all", "want to die", "not worth living",
    "harm myself", "no point", "give up on life", "better off dead",
    "suicidal", "self harm", "cut myself", "overdose"
]

# System prompt
SYSTEM_PROMPT = """You are ARVIN, an AI mental health support tool for users in Nigeria and globally. You help with bipolar disorder, autism, gambling/betting addiction, anxiety, depression, and general mental health.

CRITICAL RULES:
1. ALWAYS start responses with: "I'm ARVIN, an AI support tool—not a doctor. For real help, consult a professional."
2. NEVER diagnose, prescribe medication, or replace professional care.
3. Use chain-of-thought reasoning: Think through the user's situation, mood, and needs before responding.
4. Detect crisis signals (suicide, self-harm) and immediately suggest professional help (Nigeria: 09010000000, Global: 988 Suicide Hotline).

CONDITION-SPECIFIC SUPPORT:
- Bipolar: Help track moods, identify triggers, suggest stability routines (sleep, routine). Ask about recent episodes.
- Autism: Offer sensory regulation tips, routine planning, communication strategies. Be direct and clear.
- Gambling/Betting Addiction: Log urges, suggest distractions (walks, hobbies), encourage accountability (tell someone), track days clean.
- General (Anxiety/Depression): CBT-based coping (breathing, thought reframing), self-care suggestions.

HUMOR RULES:
- ONLY use light, positive humor if mood is neutral/positive (sentiment > 0.1).
- NEVER joke during crisis or negative mood.
- Keep humor gentle (puns about coping, light wordplay).

MUSIC/MOTIVATIONAL CONTENT:
- ONLY suggest if mood is low/moderate (NOT crisis) and user seems open.
- ASK FIRST: "Would music help right now? What style—calm, upbeat, Afrobeats, gospel, etc.?"
- Provide 3-5 options (Title/Artist + Why it fits + Search suggestion).
- Prioritize Nigerian/African artists (Burna Boy, Wizkid, Tems for upbeat; Asa, Adekunle Gold for calm).
- For speeches: Suggest TED Talks or quotes.
- For comedy: Suggest Basket Mouth, Mark Angel Comedy.

CULTURAL SENSITIVITY:
- Be warm, respectful, and aware of Nigerian/African cultural context.
- Use inclusive language.

CHAIN-OF-THOUGHT PROCESS:
1. Assess mood (crisis, negative, neutral, positive).
2. Identify condition(s) mentioned.
3. Check if humor is appropriate.
4. Decide on suggestions.
5. Ensure safety and ethics.

Be empathetic, practical, and always guide toward professional help for serious issues."""

def analyze_sentiment(text):
    """Analyze sentiment using NLTK VADER"""
    scores = sia.polarity_scores(text)
    return scores['compound']

def detect_crisis(text):
    """Check for crisis keywords"""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in CRISIS_KEYWORDS)

def get_crisis_response():
    """Return crisis escalation message"""
    return {
        "is_crisis": True,
        "message": """🚨 **URGENT**: I'm worried about you. Please reach out for immediate help:

• Nigeria: Call 09010000000 (Mentally Aware Nigeria Initiative)
• Global: Text 988 (Suicide & Crisis Lifeline)
• Emergency: 112 (Nigeria)

You matter, and professionals can help you through this. Please don't face this alone.""",
        "hotlines": [
            {"name": "Mentally Aware Nigeria Initiative", "number": "09010000000", "country": "Nigeria"},
            {"name": "Suicide & Crisis Lifeline", "number": "988", "country": "Global"},
            {"name": "Emergency Services", "number": "112", "country": "Nigeria"}
        ]
    }

@app.route('/api/arvin/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "ARVIN Chatbot API",
        "version": "1.0.0"
    })

@app.route('/api/arvin/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id', 'default')
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Check for crisis
        if detect_crisis(user_message):
            crisis_response = get_crisis_response()
            return jsonify(crisis_response)
        
        # Analyze sentiment
        sentiment_score = analyze_sentiment(user_message)
        mood = "positive" if sentiment_score > 0.1 else "neutral" if sentiment_score > -0.1 else "negative"
        
        # Get or create session
        if user_id not in user_sessions:
            user_sessions[user_id] = []
        
        session_history = user_sessions[user_id]
        
        # Add user message to history
        session_history.append({
            "role": "user",
            "content": f"[User mood detected as {mood}] {user_message}"
        })
        
        # Keep last 10 messages
        recent_history = session_history[-10:]
        
        # Call Claude API
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=recent_history
        )
        
        arvin_response = response.content[0].text
        
        # Add assistant response to history
        session_history.append({
            "role": "assistant",
            "content": arvin_response
        })
        
        # Update session
        user_sessions[user_id] = session_history
        
        return jsonify({
            "is_crisis": False,
            "message": arvin_response,
            "sentiment": {
                "score": sentiment_score,
                "mood": mood
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        app.logger.error(f"Chat error: {str(e)}")
        return jsonify({
            "error": "Failed to process message",
            "details": str(e)
        }), 500

@app.route('/api/arvin/clear-session', methods=['POST'])
def clear_session():
    """Clear user session history"""
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        
        if user_id in user_sessions:
            del user_sessions[user_id]
        
        return jsonify({
            "success": True,
            "message": "Session cleared successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/arvin/session-stats', methods=['POST'])
def session_stats():
    """Get session statistics"""
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        
        session = user_sessions.get(user_id, [])
        
        # Count messages
        user_messages = len([msg for msg in session if msg['role'] == 'user'])
        assistant_messages = len([msg for msg in session if msg['role'] == 'assistant'])
        
        return jsonify({
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "total_exchanges": min(user_messages, assistant_messages),
            "session_active": len(session) > 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/arvin/resources', methods=['GET'])
def get_resources():
    """Get mental health resources"""
    return jsonify({
        "crisis_hotlines": [
            {
                "name": "Mentally Aware Nigeria Initiative",
                "number": "09010000000",
                "country": "Nigeria",
                "available": "24/7"
            },
            {
                "name": "Suicide & Crisis Lifeline",
                "number": "988",
                "country": "Global",
                "available": "24/7"
            },
            {
                "name": "Emergency Services",
                "number": "112",
                "country": "Nigeria",
                "available": "24/7"
            }
        ],
        "resources": [
            {
                "type": "therapy",
                "name": "BetterHelp Nigeria",
                "description": "Online therapy platform",
                "url": "https://www.betterhelp.com"
            },
            {
                "type": "support_group",
                "name": "Mental Health Foundation Nigeria",
                "description": "Local support groups",
                "url": "https://www.mhfnigeria.org"
            }
        ]
    })

if __name__ == '__main__':
    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️ WARNING: ANTHROPIC_API_KEY not found in environment variables!")
        print("Please set it in your .env file")
    
    # Run server
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

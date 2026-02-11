#!/bin/bash

echo "=========================================="
echo "  ARVIN Floating Widget - Quick Start"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Starting Backend Server${NC}"
echo "----------------------------------------"

# Check if arvin.py exists
if [ ! -f "arvin.py" ]; then
    echo -e "${RED}❌ arvin.py not found in current directory${NC}"
    echo "Please navigate to the backend directory first"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install flask flask-cors anthropic nltk python-dotenv
    python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"
else
    source venv/bin/activate
fi

# Check for API key
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Creating .env file..."
    echo "ANTHROPIC_API_KEY=your_key_here" > .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env and add your ANTHROPIC_API_KEY${NC}"
    echo "Get your key from: https://console.anthropic.com/"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

echo ""
echo -e "${GREEN}✓ Starting ARVIN backend...${NC}"
echo ""

# Start backend in background
python arvin.py &
BACKEND_PID=$!

echo -e "${GREEN}✓ Backend running on http://localhost:5000 (PID: $BACKEND_PID)${NC}"
echo ""

# Wait for backend to start
sleep 3

# Test backend
echo -e "${BLUE}Step 2: Testing Backend${NC}"
echo "----------------------------------------"
response=$(curl -s http://localhost:5000/api/arvin/health)

if [[ $response == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Backend is healthy!${NC}"
    echo ""
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Response: $response"
    kill $BACKEND_PID
    exit 1
fi

echo -e "${BLUE}Step 3: Frontend Integration${NC}"
echo "----------------------------------------"
echo ""
echo "Next steps to integrate the floating widget:"
echo ""
echo "1. Copy ArvinFloatingWidget.jsx to your React app:"
echo "   ${GREEN}cp ArvinFloatingWidget.jsx /path/to/your-app/src/components/${NC}"
echo ""
echo "2. Add to your .env file (React app):"
echo "   ${GREEN}REACT_APP_ARVIN_API_URL=http://localhost:5000${NC}"
echo ""
echo "3. Import in your App.jsx:"
echo "   ${GREEN}import ArvinFloatingWidget from './components/ArvinFloatingWidget';${NC}"
echo ""
echo "4. Add to your App component (after <Routes>):"
echo "   ${GREEN}<ArvinFloatingWidget />${NC}"
echo ""
echo "5. Start your React app:"
echo "   ${GREEN}npm start${NC}"
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Backend is ready!${NC}"
echo "=========================================="
echo ""
echo "Backend running on: http://localhost:5000"
echo "Backend PID: $BACKEND_PID"
echo ""
echo "To stop backend: kill $BACKEND_PID"
echo "Or press Ctrl+C"
echo ""
echo "Full guide: ARVIN_FLOATING_WIDGET_GUIDE.md"
echo ""

# Keep script running
wait $BACKEND_PID

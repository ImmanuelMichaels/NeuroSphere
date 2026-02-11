#!/bin/bash

echo "=========================================="
echo "  ARVIN Chatbot - Automated Setup"
echo "=========================================="
echo ""

# Check Python version
echo "✓ Checking Python version..."
python3 --version

if [ $? -ne 0 ]; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

echo ""
echo "✓ Creating virtual environment..."
python3 -m venv venv

echo ""
echo "✓ Activating virtual environment..."
source venv/bin/activate

echo ""
echo "✓ Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✓ Downloading NLTK data..."
python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"

echo ""
echo "✓ Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  IMPORTANT: Please edit .env and add your ANTHROPIC_API_KEY"
    echo "   Get your API key from: https://console.anthropic.com/"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env and add your ANTHROPIC_API_KEY"
echo "2. Run: source venv/bin/activate"
echo "3. Run: python arvin_backend.py"
echo "4. Open browser to http://localhost:5000/api/arvin/health"
echo ""
echo "For frontend integration, see README_ARVIN_INSTALLATION.md"
echo ""

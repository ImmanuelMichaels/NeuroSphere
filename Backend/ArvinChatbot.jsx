import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, AlertTriangle, Phone, Trash2, TrendingUp, Sparkles } from 'lucide-react';

const ArvinChatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCrisis, setIsCrisis] = useState(false);
    const [sessionStats, setSessionStats] = useState(null);
    const messagesEndRef = useRef(null);

    const API_BASE_URL = process.env.REACT_APP_ARVIN_API_URL || 'http://localhost:5000';

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load welcome message
    useEffect(() => {
        setMessages([{
            type: 'assistant',
            content: `Hello! I'm ARVIN, your AI mental health support companion. 

I'm here to help with:
• Bipolar disorder (mood tracking, episode management)
• Autism support (sensory tools, routines)
• Gambling/betting addiction (urge management)
• General mental health (anxiety, depression, stress)

**Important**: I'm an AI tool, not a doctor. For professional help, please consult a licensed therapist or psychiatrist.

How are you feeling today?`,
            timestamp: new Date()
        }]);
    }, []);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/arvin/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: inputMessage,
                    user_id: 'user_' + (localStorage.getItem('neuropulse_user') ? 
                        JSON.parse(localStorage.getItem('neuropulse_user')).id : 'guest')
                })
            });

            const data = await response.json();

            if (data.is_crisis) {
                setIsCrisis(true);
                setMessages(prev => [...prev, {
                    type: 'crisis',
                    content: data.message,
                    hotlines: data.hotlines,
                    timestamp: new Date()
                }]);
            } else {
                setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: data.message,
                    sentiment: data.sentiment,
                    timestamp: new Date()
                }]);
            }

            // Update stats
            fetchSessionStats();

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                type: 'error',
                content: '⚠️ Connection error. Please check your internet and try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSessionStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/arvin/session-stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 'user_' + (localStorage.getItem('neuropulse_user') ? 
                        JSON.parse(localStorage.getItem('neuropulse_user')).id : 'guest')
                })
            });
            const data = await response.json();
            setSessionStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const clearSession = async () => {
        if (!window.confirm('Clear conversation history? This cannot be undone.')) return;

        try {
            await fetch(`${API_BASE_URL}/api/arvin/clear-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 'user_' + (localStorage.getItem('neuropulse_user') ? 
                        JSON.parse(localStorage.getItem('neuropulse_user')).id : 'guest')
                })
            });

            setMessages([{
                type: 'assistant',
                content: 'Session cleared. How can I help you today?',
                timestamp: new Date()
            }]);
            setIsCrisis(false);
            setSessionStats(null);

        } catch (error) {
            console.error('Error clearing session:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const getSentimentColor = (mood) => {
        switch (mood) {
            case 'positive': return '#6b8e7f';
            case 'neutral': return '#d4a574';
            case 'negative': return '#c87355';
            default: return '#9ca3af';
        }
    };

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-2xl" style={{ background: '#e8f0ed' }}>
                            <MessageCircle className="w-8 h-8" style={{ color: '#6b8e7f' }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold" style={{ color: '#4a5568' }}>
                                ARVIN AI Companion
                            </h1>
                            <p style={{ color: '#718096', fontSize: '15px' }}>
                                Your mental health support chatbot
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    {sessionStats && sessionStats.session_active && (
                        <div className="flex gap-4">
                            <div className="px-4 py-2 rounded-xl" style={{
                                background: '#e8f0ed',
                                border: '1px solid #b8d4a8'
                            }}>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" style={{ color: '#6b8e7f' }} />
                                    <span className="text-sm font-medium" style={{ color: '#4a5568' }}>
                                        {sessionStats.total_exchanges} exchanges
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Container */}
                <div className="rounded-2xl shadow-lg overflow-hidden" style={{
                    background: '#fafaf8',
                    border: '2px solid #d4cfc4',
                    height: '600px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.type === 'user' && (
                                    <div className="max-w-md">
                                        <div className="p-4 rounded-2xl" style={{
                                            background: '#e8f0ed',
                                            border: '1px solid #b8d4a8'
                                        }}>
                                            <p style={{ color: '#4a5568', fontSize: '15px', lineHeight: '1.6' }}>
                                                {msg.content}
                                            </p>
                                        </div>
                                        <p className="text-xs mt-1 text-right" style={{ color: '#9ca3af' }}>
                                            {msg.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                )}

                                {msg.type === 'assistant' && (
                                    <div className="max-w-2xl">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg" style={{ background: '#e8f0ed' }}>
                                                <Sparkles className="w-5 h-5" style={{ color: '#6b8e7f' }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="p-4 rounded-2xl" style={{
                                                    background: '#f0ebe5',
                                                    border: '1px solid #e8dfd0'
                                                }}>
                                                    <p style={{ 
                                                        color: '#4a5568', 
                                                        fontSize: '15px', 
                                                        lineHeight: '1.6',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {msg.content}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-xs" style={{ color: '#9ca3af' }}>
                                                        {msg.timestamp.toLocaleTimeString()}
                                                    </p>
                                                    {msg.sentiment && (
                                                        <span className="text-xs px-2 py-0.5 rounded" style={{
                                                            background: `${getSentimentColor(msg.sentiment.mood)}20`,
                                                            color: getSentimentColor(msg.sentiment.mood),
                                                            border: `1px solid ${getSentimentColor(msg.sentiment.mood)}40`
                                                        }}>
                                                            {msg.sentiment.mood}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'crisis' && (
                                    <div className="max-w-2xl w-full">
                                        <div className="p-6 rounded-2xl" style={{
                                            background: 'linear-gradient(135deg, #fce8e8 0%, #fef5e8 100%)',
                                            border: '3px solid #c87355'
                                        }}>
                                            <div className="flex items-start gap-3 mb-4">
                                                <AlertTriangle className="w-6 h-6" style={{ color: '#c87355' }} />
                                                <h3 className="text-lg font-semibold" style={{ color: '#c87355' }}>
                                                    Crisis Support Needed
                                                </h3>
                                            </div>
                                            <p style={{ 
                                                color: '#4a5568', 
                                                fontSize: '15px', 
                                                lineHeight: '1.6',
                                                whiteSpace: 'pre-wrap',
                                                marginBottom: '16px'
                                            }}>
                                                {msg.content}
                                            </p>
                                            {msg.hotlines && (
                                                <div className="space-y-2">
                                                    {msg.hotlines.map((hotline, i) => (
                                                        <a
                                                            key={i}
                                                            href={`tel:${hotline.number}`}
                                                            className="flex items-center gap-3 p-3 rounded-xl transition-all"
                                                            style={{
                                                                background: '#ffffff',
                                                                border: '2px solid #c87355'
                                                            }}
                                                        >
                                                            <Phone className="w-5 h-5" style={{ color: '#c87355' }} />
                                                            <div>
                                                                <p className="font-semibold" style={{ color: '#4a5568' }}>
                                                                    {hotline.name}
                                                                </p>
                                                                <p className="text-sm" style={{ color: '#718096' }}>
                                                                    {hotline.number} ({hotline.country})
                                                                </p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'error' && (
                                    <div className="max-w-md">
                                        <div className="p-4 rounded-2xl" style={{
                                            background: '#fce8e8',
                                            border: '1px solid #f0b8b8'
                                        }}>
                                            <p style={{ color: '#c87355', fontSize: '15px' }}>
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-2 p-4 rounded-2xl" style={{
                                    background: '#f0ebe5',
                                    border: '1px solid #e8dfd0'
                                }}>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6b8e7f' }}></div>
                                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6b8e7f', animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6b8e7f', animationDelay: '0.4s' }}></div>
                                    </div>
                                    <span className="text-sm" style={{ color: '#718096' }}>
                                        ARVIN is thinking...
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4" style={{ borderTop: '2px solid #e8e5df' }}>
                        <div className="flex gap-3">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message... (Press Enter to send)"
                                rows="2"
                                className="flex-1 px-4 py-3 rounded-xl resize-none"
                                style={{
                                    background: '#fafaf8',
                                    border: '2px solid #d4cfc4',
                                    color: '#4a5568',
                                    fontSize: '15px',
                                    outline: 'none'
                                }}
                                disabled={isLoading}
                            />
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={sendMessage}
                                    disabled={isLoading || !inputMessage.trim()}
                                    className="p-3 rounded-xl transition-all"
                                    style={{
                                        background: isLoading || !inputMessage.trim() ? '#e8e5df' : '#6b8e7f',
                                        color: '#ffffff',
                                        cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <Send className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={clearSession}
                                    className="p-3 rounded-xl transition-all"
                                    style={{
                                        background: '#f0ebe5',
                                        color: '#718096'
                                    }}
                                    title="Clear conversation"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-3 p-3 rounded-xl" style={{
                            background: '#fff9f0',
                            border: '1px solid #f0dab8'
                        }}>
                            <p className="text-xs" style={{ color: '#718096', lineHeight: '1.5' }}>
                                <strong>Privacy Notice:</strong> Conversations are stored in-session only for context. 
                                ARVIN is not a replacement for professional mental health care.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Crisis Banner */}
                {isCrisis && (
                    <div className="mt-6 p-6 rounded-2xl" style={{
                        background: 'linear-gradient(135deg, #fce8e8 0%, #fef5e8 100%)',
                        border: '3px solid #c87355'
                    }}>
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-6 h-6" style={{ color: '#c87355' }} />
                            <h3 className="text-lg font-semibold" style={{ color: '#c87355' }}>
                                Crisis Resources Available
                            </h3>
                        </div>
                        <p style={{ color: '#4a5568', fontSize: '14px', lineHeight: '1.6' }}>
                            If you're in crisis, please reach out to a professional immediately. 
                            The hotlines above are available 24/7.
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@300;400;500;600&display=swap');
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .animate-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ArvinChatbot;

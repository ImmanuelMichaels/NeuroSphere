import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, AlertTriangle, Phone, Trash2, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const ArvinFloatingWidgetVoice = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCrisis, setIsCrisis] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Voice-related state
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [transcript, setTranscript] = useState('');
    
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    const API_BASE_URL = import.meta.env.VITE_ARVIN_API_URL ?? 'http://localhost:5000';

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                console.log('Voice recognition started');
            };

            recognitionRef.current.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
                
                // If final result, set as input message
                if (event.results[current].isFinal) {
                    setInputMessage(transcriptText);
                    setTranscript('');
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                console.log('Voice recognition ended');
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load welcome message on mount
    useEffect(() => {
        const welcomeMessage = {
            type: 'assistant',
            content: `Hello! I'm ARVIN, your AI mental health support companion. 

I can help with:
• Bipolar disorder & mood tracking
• Autism support & sensory tools
• Gambling/betting addiction
• Anxiety, depression & stress

**I'm an AI tool, not a doctor. For professional help, consult a licensed therapist.**

You can type or use the microphone to talk to me!

How are you feeling today?`,
            timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
        setUnreadCount(1);

        // Speak welcome message if voice is enabled
        if (voiceEnabled && isOpen) {
            speakText("Hello! I'm ARVIN, your AI mental health support companion. You can type or use the microphone to talk to me. How are you feeling today?");
        }
    }, []);

    // Update unread count
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.type === 'assistant' || lastMessage.type === 'crisis') {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [messages, isOpen]);

    // Clear unread count when opened
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Stop speaking when widget closes
    useEffect(() => {
        if (!isOpen && isSpeaking) {
            stopSpeaking();
        }
    }, [isOpen]);

    const getUserId = () => {
        try {
            const user = localStorage.getItem('neuropulse_user');
            if (user) {
                const parsed = JSON.parse(user);
                return parsed.id || 'guest';
            }
        } catch (error) {
            console.error('Error getting user ID:', error);
        }
        return 'guest_' + Math.random().toString(36).substr(2, 9);
    };

    // Text-to-Speech function
    const speakText = (text) => {
        if (!voiceEnabled) return;

        // Stop any ongoing speech
        stopSpeaking();

        // Clean text for speech (remove markdown, emojis, etc.)
        const cleanText = text
            .replace(/[#*_`~]/g, '') // Remove markdown
            .replace(/[•✓✗]/g, '') 
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
            .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Configure voice settings for warm, calm delivery
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        
        // Try to use a pleasant voice (prefer female voices for mental health support)
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Samantha') || 
            voice.name.includes('Karen')
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // Toggle voice input
    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                alert('Could not start voice recognition. Please check microphone permissions.');
            }
        }
    };

    // Toggle voice output
    const toggleVoiceOutput = () => {
        setVoiceEnabled(!voiceEnabled);
        if (isSpeaking) {
            stopSpeaking();
        }
    };

    const sendMessage = async (messageText = inputMessage) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        // Stop any ongoing speech
        stopSpeaking();

        try {
            const response = await fetch(`${API_BASE_URL}/api/arvin/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: messageText,
                    user_id: getUserId()
                })
            });

            const data = await response.json();

            if (data.is_crisis) {
                setIsCrisis(true);
                const crisisMsg = {
                    type: 'crisis',
                    content: data.message,
                    hotlines: data.hotlines,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, crisisMsg]);
                
                // Speak crisis message
                speakText("I'm very worried about you. Please reach out for immediate help. I'm showing you emergency hotlines now.");
            } else {
                const assistantMsg = {
                    type: 'assistant',
                    content: data.message,
                    sentiment: data.sentiment,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMsg]);
                
                // Speak assistant response
                speakText(data.message);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = {
                type: 'error',
                content: '⚠️ Connection error. Please check your internet and try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
            speakText('Connection error. Please check your internet and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = async () => {
        if (!window.confirm('Clear conversation history?')) return;

        stopSpeaking();

        try {
            await fetch(`${API_BASE_URL}/api/arvin/clear-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: getUserId()
                })
            });

            setMessages([{
                type: 'assistant',
                content: 'Session cleared. How can I help you today?',
                timestamp: new Date()
            }]);
            setIsCrisis(false);
            speakText('Session cleared. How can I help you today?');

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
        <>
            {/* Floating Chat Window */}
            {isOpen && (
                <div 
                    className="fixed bottom-24 right-6 z-50 shadow-2xl"
                    style={{
                        width: '400px',
                        maxWidth: 'calc(100vw - 48px)',
                        height: '600px',
                        maxHeight: 'calc(100vh - 150px)',
                        fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
                    }}
                >
                    <div className="h-full rounded-2xl overflow-hidden" style={{
                        background: '#fafaf8',
                        border: '2px solid #d4cfc4'
                    }}>
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between" style={{
                            background: 'linear-gradient(135deg, #6b8e7f 0%, #5a7d6f 100%)',
                            borderBottom: '2px solid #5a7d6f'
                        }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg relative" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                                    <MessageCircle className="w-5 h-5" style={{ color: '#ffffff' }} />
                                    {isSpeaking && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ background: '#f97316' }}></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold" style={{ color: '#ffffff', fontSize: '16px' }}>
                                        ARVIN {isSpeaking && '🔊'}
                                    </h3>
                                    <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                        {isListening ? '🎤 Listening...' : 'AI Mental Health Support'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleVoiceOutput}
                                    className="p-2 rounded-lg transition-all"
                                    style={{
                                        background: voiceEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff'
                                    }}
                                    title={voiceEnabled ? 'Voice ON' : 'Voice OFF'}
                                >
                                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={clearSession}
                                    className="p-2 rounded-lg transition-all"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff'
                                    }}
                                    title="Clear conversation"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg transition-all"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff'
                                    }}
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            className="overflow-y-auto p-4 space-y-3"
                            style={{ height: 'calc(100% - 220px)' }}
                        >
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.type === 'user' && (
                                        <div className="max-w-[75%]">
                                            <div className="p-3 rounded-2xl" style={{
                                                background: '#e8f0ed',
                                                border: '1px solid #b8d4a8'
                                            }}>
                                                <p style={{ color: '#4a5568', fontSize: '14px', lineHeight: '1.5' }}>
                                                    {msg.content}
                                                </p>
                                            </div>
                                            <p className="text-xs mt-1 text-right" style={{ color: '#9ca3af' }}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    )}

                                    {msg.type === 'assistant' && (
                                        <div className="max-w-[85%]">
                                            <div className="flex items-start gap-2">
                                                <div className="p-1.5 rounded-lg mt-1" style={{ background: '#e8f0ed' }}>
                                                    <Sparkles className="w-3.5 h-3.5" style={{ color: '#6b8e7f' }} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="p-3 rounded-2xl" style={{
                                                        background: '#f0ebe5',
                                                        border: '1px solid #e8dfd0'
                                                    }}>
                                                        <p style={{ 
                                                            color: '#4a5568', 
                                                            fontSize: '14px', 
                                                            lineHeight: '1.5',
                                                            whiteSpace: 'pre-wrap'
                                                        }}>
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {msg.sentiment && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded" style={{
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
                                        <div className="w-full">
                                            <div className="p-4 rounded-2xl" style={{
                                                background: 'linear-gradient(135deg, #fce8e8 0%, #fef5e8 100%)',
                                                border: '2px solid #c87355'
                                            }}>
                                                <div className="flex items-start gap-2 mb-2">
                                                    <AlertTriangle className="w-5 h-5" style={{ color: '#c87355' }} />
                                                    <h4 className="font-semibold text-sm" style={{ color: '#c87355' }}>
                                                        Crisis Support
                                                    </h4>
                                                </div>
                                                <p style={{ 
                                                    color: '#4a5568', 
                                                    fontSize: '13px', 
                                                    lineHeight: '1.5',
                                                    whiteSpace: 'pre-wrap',
                                                    marginBottom: '12px'
                                                }}>
                                                    {msg.content}
                                                </p>
                                                {msg.hotlines && (
                                                    <div className="space-y-2">
                                                        {msg.hotlines.slice(0, 2).map((hotline, i) => (
                                                            <a
                                                                key={i}
                                                                href={`tel:${hotline.number}`}
                                                                className="flex items-center gap-2 p-2 rounded-lg transition-all"
                                                                style={{
                                                                    background: '#ffffff',
                                                                    border: '2px solid #c87355'
                                                                }}
                                                            >
                                                                <Phone className="w-4 h-4" style={{ color: '#c87355' }} />
                                                                <div>
                                                                    <p className="font-semibold text-xs" style={{ color: '#4a5568' }}>
                                                                        {hotline.name}
                                                                    </p>
                                                                    <p className="text-xs" style={{ color: '#718096' }}>
                                                                        {hotline.number}
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
                                        <div className="max-w-[75%]">
                                            <div className="p-3 rounded-2xl" style={{
                                                background: '#fce8e8',
                                                border: '1px solid #f0b8b8'
                                            }}>
                                                <p style={{ color: '#c87355', fontSize: '14px' }}>
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 p-3 rounded-2xl" style={{
                                        background: '#f0ebe5',
                                        border: '1px solid #e8dfd0'
                                    }}>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6b8e7f' }}></div>
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6b8e7f', animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6b8e7f', animationDelay: '0.4s' }}></div>
                                        </div>
                                        <span className="text-xs" style={{ color: '#718096' }}>
                                            ARVIN is thinking...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {transcript && (
                                <div className="flex justify-end">
                                    <div className="max-w-[75%] p-2 rounded-lg" style={{
                                        background: 'rgba(107, 142, 127, 0.1)',
                                        border: '1px dashed #6b8e7f'
                                    }}>
                                        <p className="text-xs italic" style={{ color: '#6b8e7f' }}>
                                            🎤 {transcript}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3" style={{ 
                            borderTop: '2px solid #e8e5df',
                            background: '#fafaf8'
                        }}>
                            {/* Voice indicator */}
                            {isListening && (
                                <div className="mb-2 p-2 rounded-lg text-center" style={{
                                    background: 'rgba(107, 142, 127, 0.1)',
                                    border: '1px solid #6b8e7f'
                                }}>
                                    <p className="text-xs font-medium" style={{ color: '#6b8e7f' }}>
                                        🎤 Listening... Speak now
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={toggleVoiceInput}
                                    disabled={isLoading}
                                    className="p-3 rounded-xl transition-all"
                                    style={{
                                        background: isListening ? '#6b8e7f' : '#e8f0ed',
                                        color: isListening ? '#ffffff' : '#6b8e7f',
                                        border: isListening ? '2px solid #6b8e7f' : '2px solid #b8d4a8',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        minWidth: '48px'
                                    }}
                                    title={isListening ? 'Stop listening' : 'Start voice input'}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type or speak your message..."
                                    rows="2"
                                    className="flex-1 px-3 py-2 rounded-xl resize-none"
                                    style={{
                                        background: '#fafaf8',
                                        border: '2px solid #d4cfc4',
                                        color: '#4a5568',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    disabled={isLoading || isListening}
                                />
                                
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={isLoading || !inputMessage.trim() || isListening}
                                    className="p-3 rounded-xl transition-all self-end"
                                    style={{
                                        background: isLoading || !inputMessage.trim() || isListening ? '#e8e5df' : '#6b8e7f',
                                        color: '#ffffff',
                                        cursor: isLoading || !inputMessage.trim() || isListening ? 'not-allowed' : 'pointer',
                                        minWidth: '48px'
                                    }}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Voice tips */}
                            <div className="mt-2 text-center">
                                <p className="text-xs" style={{ color: '#9ca3af' }}>
                                    {voiceEnabled ? '🔊 Voice responses ON' : '🔇 Voice responses OFF'} 
                                    {' • '}
                                    Click mic to speak
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 rounded-full shadow-2xl transition-all transform hover:scale-110"
                style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #6b8e7f 0%, #5a7d6f 100%)',
                    border: '3px solid #ffffff'
                }}
            >
                {isOpen ? (
                    <X className="w-8 h-8" style={{ color: '#ffffff', margin: 'auto' }} />
                ) : (
                    <div className="relative">
                        <MessageCircle className="w-8 h-8" style={{ color: '#ffffff', margin: 'auto' }} />
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{
                                background: '#c87355',
                                width: '24px',
                                height: '24px',
                                border: '2px solid #ffffff'
                            }}>
                                <span className="text-xs font-bold" style={{ color: '#ffffff' }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </div>
                        )}
                        {isSpeaking && (
                            <div className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{
                                background: '#f97316',
                                width: '20px',
                                height: '20px',
                                border: '2px solid #ffffff'
                            }}>
                                <Volume2 className="w-3 h-3" style={{ color: '#ffffff' }} />
                            </div>
                        )}
                    </div>
                )}
            </button>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@300;400;500;600&display=swap');
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .animate-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @media (max-width: 640px) {
                    .fixed.bottom-24.right-6 {
                        bottom: 90px;
                        right: 12px;
                        left: 12px;
                        width: auto !important;
                        max-width: none !important;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </>
    );
};

export default ArvinFloatingWidgetVoice;
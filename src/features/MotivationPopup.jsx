import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles, X } from 'lucide-react';
import { 
    selectMotivationMessage, 
    logMotivationEvent, 
    getStreakMessage 
} from './MotivationEngine';

/**
 * Glassmorphism Motivation Popup
 * Gentle, non-intrusive encouragement overlay
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether popup should be shown
 * @param {Object} props.userAction - The action that triggered the popup
 * @param {string} props.userAction.type - Type: 'medication', 'meal', 'vitals', etc.
 * @param {Date} props.userAction.timestamp - When action occurred
 * @param {number} props.streakCount - Number of consecutive days (default: 0)
 * @param {Function} props.onDismiss - Callback when popup is dismissed
 */
const MotivationPopup = ({ 
    isVisible, 
    userAction, 
    streakCount = 0,
    onDismiss 
}) => {
    const [isExiting, setIsExiting] = useState(false);

    const message = useMemo(() => {
        return isVisible ? selectMotivationMessage(userAction) : null;
    }, [isVisible, userAction]);

    const handleDismiss = useCallback((userEngaged) => {
        if (message) {
            logMotivationEvent(message, userAction, userEngaged);
        }

        setIsExiting(true);
        setTimeout(() => {
            onDismiss();
            setIsExiting(false);
        }, 300);
    }, [message, userAction, onDismiss]);

    useEffect(() => {
        if (isVisible) {
            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => {
                handleDismiss(false); // false = auto-dismissed
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, handleDismiss]);

    if (!isVisible || !message) return null;

    const streakMessage = getStreakMessage(streakCount);

    return (
        <div 
            className={`fixed inset-0 z-40 flex items-start justify-center pt-20 px-6 pointer-events-none ${isExiting ? 'opacity-0' : 'opacity-100'}`}
            style={{
                transition: 'opacity 0.3s ease-in-out'
            }}
        >
            <div 
                className={`relative max-w-md w-full pointer-events-auto ${isExiting ? 'slide-up-out' : 'slide-down-in'}`}
                style={{
                    background: 'rgba(250, 250, 248, 0.85)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 8px 32px rgba(107, 142, 127, 0.15), 0 2px 8px rgba(107, 142, 127, 0.1)',
                    borderRadius: '24px',
                    overflow: 'hidden'
                }}
            >
                {/* Glassmorphism gradient overlay */}
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(107, 142, 127, 0.1) 0%, rgba(184, 145, 109, 0.05) 100%)',
                        pointerEvents: 'none'
                    }}
                />

                {/* Content */}
                <div className="relative p-6">
                    {/* Header with icon */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div 
                                className="p-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(107, 142, 127, 0.15) 0%, rgba(107, 142, 127, 0.05) 100%)',
                                    border: '1px solid rgba(107, 142, 127, 0.2)'
                                }}
                            >
                                <Sparkles className="w-5 h-5" style={{ color: '#6b8e7f' }} />
                            </div>
                            <h3 className="font-semibold" style={{ 
                                color: '#4a5568',
                                fontSize: '16px',
                                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                            }}>
                                You're doing great!
                            </h3>
                        </div>
                        <button
                            onClick={() => handleDismiss(true)}
                            className="p-2 rounded-lg transition-all"
                            style={{
                                background: 'rgba(113, 128, 150, 0.1)',
                                color: '#718096'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(113, 128, 150, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(113, 128, 150, 0.1)';
                            }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Message */}
                    <div className="mb-4">
                        <p 
                            className="text-lg leading-relaxed"
                            style={{ 
                                color: '#4a5568',
                                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                            }}
                        >
                            {message.text}
                        </p>
                    </div>

                    {/* Streak Badge */}
                    {streakMessage && (
                        <div 
                            className="p-3 rounded-xl mb-3"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(212, 165, 116, 0.05) 100%)',
                                border: '1px solid rgba(212, 165, 116, 0.3)'
                            }}
                        >
                            <p className="font-medium text-center" style={{ 
                                color: '#d4a574',
                                fontSize: '14px'
                            }}>
                                {streakMessage}
                            </p>
                        </div>
                    )}

                    {/* Evidence base (subtle) */}
                    <div className="pt-3" style={{ borderTop: '1px solid rgba(212, 207, 196, 0.3)' }}>
                        <p className="text-xs" style={{ 
                            color: '#9ca3af',
                            fontStyle: 'italic',
                            textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)'
                        }}>
                            💡 {message.evidenceBase}
                        </p>
                    </div>
                </div>

                {/* Subtle shine effect */}
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                        animation: 'shine 3s ease-in-out infinite',
                        pointerEvents: 'none'
                    }}
                />
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@300;400;500;600&display=swap');

                @keyframes slide-down-in {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up-out {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                }

                @keyframes shine {
                    0% {
                        left: -100%;
                    }
                    50%, 100% {
                        left: 100%;
                    }
                }

                .slide-down-in {
                    animation: slide-down-in 0.4s ease-out forwards;
                }

                .slide-up-out {
                    animation: slide-up-out 0.3s ease-in forwards;
                }

                /* Respect reduced motion preferences */
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

/**
 * Example usage component showing integration
 * Demonstrates how to integrate MotivationPopup into your app
 */
const MotivationPopupExample = () => {
    const [showMotivation, setShowMotivation] = useState(false);
    const [currentAction, setCurrentAction] = useState({
        type: 'medication',
        timestamp: new Date()
    });
    const [streakCount, setStreakCount] = useState(7);

    const simulateAction = (actionType) => {
        setCurrentAction({
            type: actionType,
            timestamp: new Date()
        });
        setShowMotivation(true);
    };

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-semibold mb-8" style={{ color: '#4a5568' }}>
                    Motivation System Demo
                </h1>

                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#4a5568' }}>
                        Simulate User Actions
                    </h2>
                    <p className="mb-4" style={{ color: '#718096', fontSize: '15px' }}>
                        Click a button to trigger a motivation popup based on the action type
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => simulateAction('medication')}
                            className="p-6 rounded-xl font-medium transition-all"
                            style={{
                                background: '#e8f0ed',
                                color: '#6b8e7f',
                                border: '2px solid #b8d4a8',
                                minHeight: '80px'
                            }}
                        >
                            Log Medication
                        </button>
                        <button
                            onClick={() => simulateAction('meal')}
                            className="p-6 rounded-xl font-medium transition-all"
                            style={{
                                background: '#f5f0e8',
                                color: '#b8916d',
                                border: '2px solid #e8d4b8',
                                minHeight: '80px'
                            }}
                        >
                            Log Meal
                        </button>
                        <button
                            onClick={() => simulateAction('vitals')}
                            className="p-6 rounded-xl font-medium transition-all"
                            style={{
                                background: '#fff9f0',
                                color: '#d4a574',
                                border: '2px solid #f0dab8',
                                minHeight: '80px'
                            }}
                        >
                            Log Vitals
                        </button>
                        <button
                            onClick={() => simulateAction('exercise')}
                            className="p-6 rounded-xl font-medium transition-all"
                            style={{
                                background: '#eae8f0',
                                color: '#6d6b8e',
                                border: '2px solid #d4d2e0',
                                minHeight: '80px'
                            }}
                        >
                            Log Exercise
                        </button>
                        <button
                            onClick={() => simulateAction('mood_log')}
                            className="p-6 rounded-xl font-medium transition-all"
                            style={{
                                background: '#f0ebe5',
                                color: '#8b7355',
                                border: '2px solid #d4cfc4',
                                minHeight: '80px'
                            }}
                        >
                            Log Mood
                        </button>
                        <button
                            onClick={() => simulateAction('therapy_note')}
                            className="p-6 rounded-xl font-medium transition-all"
                            style={{
                                background: '#e8f0ed',
                                color: '#6b8e7f',
                                border: '2px solid #b8d4a8',
                                minHeight: '80px'
                            }}
                        >
                            Add Therapy Note
                        </button>
                    </div>
                </div>

                <div className="p-6 rounded-xl" style={{
                    background: '#fafaf8',
                    border: '2px solid #d4cfc4'
                }}>
                    <h3 className="font-semibold mb-3" style={{ color: '#4a5568' }}>
                        Current Streak
                    </h3>
                    <p className="mb-4" style={{ color: '#718096', fontSize: '14px' }}>
                        Adjust the streak count to see different milestone messages
                    </p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setStreakCount(Math.max(0, streakCount - 1))}
                            className="px-4 py-2 rounded-lg font-medium transition-all"
                            style={{ 
                                background: '#e8e5df', 
                                color: '#4a5568',
                                minHeight: '48px',
                                minWidth: '48px'
                            }}
                        >
                            -
                        </button>
                        <span className="text-3xl font-bold" style={{ color: '#6b8e7f' }}>
                            {streakCount} days
                        </span>
                        <button
                            onClick={() => setStreakCount(streakCount + 1)}
                            className="px-4 py-2 rounded-lg font-medium transition-all"
                            style={{ 
                                background: '#e8e5df', 
                                color: '#4a5568',
                                minHeight: '48px',
                                minWidth: '48px'
                            }}
                        >
                            +
                        </button>
                    </div>
                    <div className="mt-4 p-3 rounded-lg" style={{ background: '#f0ebe5' }}>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                            Try streak counts: 3, 7, 14, 30, 60, or 90 to see milestone messages
                        </p>
                    </div>
                </div>
            </div>

            <MotivationPopup
                isVisible={showMotivation}
                userAction={currentAction}
                streakCount={streakCount}
                onDismiss={() => setShowMotivation(false)}
            />
        </div>
    );
};

export { MotivationPopup, MotivationPopupExample };
export default MotivationPopup;

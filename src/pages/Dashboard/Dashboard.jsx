import React, { useState } from 'react';
import { Send, Calendar, Activity, Shield, Bell, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const Dashboard = () => {
    const [input, setInput] = useState('');
    const [showResponse, setShowResponse] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        modules: false,
        wellness: false
    });

    const handleTriage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setShowResponse(true);
        setTimeout(() => setInput(''), 100);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            {/* Crisis Button - Fixed Position, Always Accessible */}
            <button 
                className="fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg transition-all duration-200"
                style={{
                    background: 'linear-gradient(135deg, #d4a574 0%, #b8865f 100%)',
                    color: '#ffffff',
                    border: '3px solid #a67650',
                    minWidth: '160px',
                    minHeight: '60px',
                    fontSize: '16px',
                    fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.03)';
                    e.target.style.boxShadow = '0 8px 20px rgba(166, 118, 80, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 12px rgba(166, 118, 80, 0.2)';
                }}
            >
                <Shield className="w-6 h-6" />
                <span>Need Help Now</span>
            </button>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Gentle Welcome Section */}
                <section className="mb-12">
                    <div className="text-center space-y-4 mb-8">
                        <h1 className="text-4xl font-medium" style={{ color: '#4a5568', letterSpacing: '-0.02em' }}>
                            Welcome back, <span style={{ color: '#6b8e7f', fontWeight: '600' }}>Michael</span>
                        </h1>
                        <p className="text-lg" style={{ color: '#718096' }}>
                            How are you feeling today?
                        </p>
                    </div>

                    {/* AI Input - Large Touch Target */}
                    <div className="max-w-2xl mx-auto">
                        <form onSubmit={handleTriage}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Share what's on your mind..."
                                    className="w-full px-6 py-5 rounded-2xl shadow-sm transition-all duration-200"
                                    style={{
                                        background: '#fafaf8',
                                        border: '2px solid #d4cfc4',
                                        color: '#4a5568',
                                        fontSize: '17px',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6b8e7f';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 142, 127, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#d4cfc4';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 p-3 rounded-xl transition-all"
                                    style={{
                                        transform: 'translateY(-50%)',
                                        background: '#e8dfd0',
                                        color: '#6b8e7f'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#6b8e7f';
                                        e.target.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#e8dfd0';
                                        e.target.style.color = '#6b8e7f';
                                    }}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        {showResponse && (
                            <div className="mt-6 p-6 rounded-2xl" style={{
                                background: '#f0ebe5',
                                border: '2px solid #d4cfc4'
                            }}>
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-2 h-2 rounded-full mt-2" style={{ background: '#6b8e7f' }}></div>
                                    <div>
                                        <p className="font-medium mb-1" style={{ color: '#4a5568', fontSize: '15px' }}>Suggestion</p>
                                        <p style={{ color: '#718096', fontSize: '15px', lineHeight: '1.6' }}>
                                            Based on what you shared, logging your current mood in the Mood Tracker might be helpful. 
                                            Would you like to do that now?
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-5 py-3 rounded-xl font-medium transition-all" style={{
                                        background: '#6b8e7f',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        minHeight: '48px'
                                    }}>
                                        Log Mood
                                    </button>
                                    <button className="px-5 py-3 rounded-xl font-medium transition-all" style={{
                                        background: '#e8dfd0',
                                        color: '#6b8e7f',
                                        fontSize: '14px',
                                        minHeight: '48px'
                                    }}>
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Medication Reminder - Prominent Card */}
                <div className="mb-8 p-6 rounded-2xl shadow-sm" style={{
                    background: 'linear-gradient(135deg, #fff9f0 0%, #fef5e8 100%)',
                    border: '3px solid #f0dab8'
                }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl" style={{ background: '#fce8c8' }}>
                                <Bell className="w-7 h-7" style={{ color: '#d4a574' }} />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1" style={{ color: '#4a5568', fontSize: '17px' }}>
                                    Medication Reminder
                                </h3>
                                <p style={{ color: '#718096', fontSize: '15px' }}>
                                    Lithium Carbonate • 300mg • Due at 9:00 AM
                                </p>
                            </div>
                        </div>
                        <button className="px-6 py-3 rounded-xl font-medium transition-all" style={{
                            background: '#d4a574',
                            color: '#ffffff',
                            minWidth: '140px',
                            minHeight: '52px',
                            fontSize: '15px'
                        }}>
                            Mark Taken
                        </button>
                    </div>
                </div>

                {/* Primary Cards - Generous Spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Next Appointment */}
                    <div className="p-8 rounded-2xl shadow-sm" style={{
                        background: '#fafaf8',
                        border: '2px solid #d4cfc4'
                    }}>
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-xs font-medium mb-2" style={{
                                    color: '#9ca3af',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase'
                                }}>
                                    Next Session
                                </p>
                                <h3 className="text-2xl font-semibold mb-2" style={{ color: '#4a5568' }}>
                                    Tomorrow
                                </h3>
                                <p className="text-lg mb-1" style={{ color: '#6b8e7f', fontWeight: '500' }}>
                                    Dr. Sarah Jenning
                                </p>
                                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                    10:00 AM • Video Call • 45 minutes
                                </p>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: '#e8e5df' }}>
                                <Calendar className="w-6 h-6" style={{ color: '#6b8e7f' }} />
                            </div>
                        </div>
                        <button className="w-full py-4 rounded-xl font-medium transition-all" style={{
                            background: '#e8dfd0',
                            color: '#6b8e7f',
                            fontSize: '15px',
                            minHeight: '52px'
                        }}>
                            Join Waiting Room
                        </button>
                    </div>

                    {/* Wellness Streak */}
                    <div className="p-8 rounded-2xl shadow-sm" style={{
                        background: '#fafaf8',
                        border: '2px solid #d4cfc4'
                    }}>
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-xs font-medium mb-2" style={{
                                    color: '#9ca3af',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase'
                                }}>
                                    Wellness Progress
                                </p>
                                <h3 className="text-4xl font-semibold mb-2" style={{ color: '#6b8e7f' }}>
                                    12 Days
                                </h3>
                                <p style={{ color: '#718096', fontSize: '15px' }}>
                                    Consistent medication adherence
                                </p>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: '#e8f0ed' }}>
                                <CheckCircle2 className="w-6 h-6" style={{ color: '#6b8e7f' }} />
                            </div>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#e8e5df' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{
                                width: '85%',
                                background: 'linear-gradient(90deg, #6b8e7f 0%, #8daa9d 100%)'
                            }}></div>
                        </div>
                    </div>
                </div>

                {/* Progressive Disclosure - Collapsible Sections */}
                <div className="space-y-4">
                    {/* Care Modules Section */}
                    <div className="rounded-2xl shadow-sm overflow-hidden" style={{
                        background: '#fafaf8',
                        border: '2px solid #d4cfc4'
                    }}>
                        <button
                            onClick={() => toggleSection('modules')}
                            className="w-full p-6 flex items-center justify-between transition-all"
                            style={{ minHeight: '72px' }}
                        >
                            <h2 className="text-xl font-semibold" style={{ color: '#4a5568' }}>
                                Care Modules
                            </h2>
                            {expandedSections.modules ? 
                                <ChevronUp className="w-6 h-6" style={{ color: '#9ca3af' }} /> : 
                                <ChevronDown className="w-6 h-6" style={{ color: '#9ca3af' }} />
                            }
                        </button>
                        
                        {expandedSections.modules && (
                            <div className="px-6 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { 
                                            title: "Mood Tracker", 
                                            desc: "Log and visualize patterns",
                                            bg: '#f0ebe5',
                                            color: '#8b7355'
                                        },
                                        { 
                                            title: "Genetics", 
                                            desc: "Medication optimization",
                                            bg: '#e8f0ed',
                                            color: '#6b8e7f'
                                        },
                                        { 
                                            title: "Sensory Support", 
                                            desc: "Tools for regulation",
                                            bg: '#f5f0e8',
                                            color: '#b8916d'
                                        },
                                        { 
                                            title: "Journal", 
                                            desc: "Private thoughts & CBT",
                                            bg: '#eae8f0',
                                            color: '#6d6b8e'
                                        }
                                    ].map((module, i) => (
                                        <button
                                            key={i}
                                            className="p-6 rounded-xl text-left transition-all"
                                            style={{
                                                background: module.bg,
                                                border: '2px solid transparent',
                                                minHeight: '100px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.borderColor = module.color;
                                                e.target.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.borderColor = 'transparent';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <h4 className="font-semibold mb-1" style={{ 
                                                color: module.color,
                                                fontSize: '16px'
                                            }}>
                                                {module.title}
                                            </h4>
                                            <p style={{ color: '#718096', fontSize: '14px' }}>
                                                {module.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wellness Details Section */}
                    <div className="rounded-2xl shadow-sm overflow-hidden" style={{
                        background: '#fafaf8',
                        border: '2px solid #d4cfc4'
                    }}>
                        <button
                            onClick={() => toggleSection('wellness')}
                            className="w-full p-6 flex items-center justify-between transition-all"
                            style={{ minHeight: '72px' }}
                        >
                            <h2 className="text-xl font-semibold" style={{ color: '#4a5568' }}>
                                This Week's Wellness
                            </h2>
                            {expandedSections.wellness ? 
                                <ChevronUp className="w-6 h-6" style={{ color: '#9ca3af' }} /> : 
                                <ChevronDown className="w-6 h-6" style={{ color: '#9ca3af' }} />
                            }
                        </button>
                        
                        {expandedSections.wellness && (
                            <div className="px-6 pb-6 space-y-4">
                                <div className="p-5 rounded-xl" style={{ background: '#f0ebe5' }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span style={{ color: '#718096', fontSize: '14px' }}>Sleep Quality</span>
                                        <span className="font-semibold" style={{ color: '#6b8e7f' }}>7.5 hrs avg</span>
                                    </div>
                                    <div className="h-2 rounded-full" style={{ background: '#e8e5df' }}>
                                        <div className="h-full rounded-full" style={{
                                            width: '75%',
                                            background: '#6b8e7f'
                                        }}></div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl" style={{ background: '#f0ebe5' }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span style={{ color: '#718096', fontSize: '14px' }}>Mood Stability</span>
                                        <span className="font-semibold" style={{ color: '#6b8e7f' }}>85%</span>
                                    </div>
                                    <div className="h-2 rounded-full" style={{ background: '#e8e5df' }}>
                                        <div className="h-full rounded-full" style={{
                                            width: '85%',
                                            background: '#6b8e7f'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@300;400;500;600&display=swap');
                
                * {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                button {
                    cursor: pointer;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }

                input::placeholder {
                    color: #9ca3af;
                    opacity: 0.7;
                }

                /* Reduced motion for users who prefer it */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;

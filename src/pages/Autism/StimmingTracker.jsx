import React, { useState } from 'react';
import { Plus, TrendingUp, Calendar, ChevronDown, ChevronUp, Circle } from 'lucide-react';

const StimmingTracker = () => {
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAddStim, setShowAddStim] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({
        common: true,
        sensory: false,
        motor: false
    });

    // Mock data for heat map - intensity levels 0-4
    const weekData = [
        { day: 'Mon', date: '27', stimming: 2, mood: 3 },
        { day: 'Tue', date: '28', stimming: 1, mood: 4 },
        { day: 'Wed', date: '29', stimming: 3, mood: 2 },
        { day: 'Thu', date: '30', stimming: 4, mood: 2 },
        { day: 'Fri', date: '31', stimming: 2, mood: 3 },
        { day: 'Sat', date: '01', stimming: 1, mood: 4 },
        { day: 'Sun', date: '02', stimming: 2, mood: 4 }
    ];

    const commonStims = [
        { id: 1, name: 'Hand Flapping', category: 'motor', logged: 12 },
        { id: 2, name: 'Rocking', category: 'motor', logged: 8 },
        { id: 3, name: 'Humming', category: 'sensory', logged: 15 },
        { id: 4, name: 'Finger Tapping', category: 'motor', logged: 20 }
    ];

    const getIntensityColor = (level) => {
        const colors = {
            0: '#f5f3ef',
            1: '#d9ead3',
            2: '#b8d4a8',
            3: '#8daa9d',
            4: '#6b8e7f'
        };
        return colors[level] || colors[0];
    };

    const getMoodEmoji = (level) => {
        const emojis = {
            1: '😔',
            2: '😕',
            3: '😐',
            4: '😊',
            5: '😄'
        };
        return emojis[level] || '😐';
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-semibold mb-3" style={{ color: '#4a5568' }}>
                        Symptom & Stimming Tracker
                    </h1>
                    <p style={{ color: '#718096', fontSize: '16px' }}>
                        Track patterns and understand your needs
                    </p>
                </div>

                {/* Heat Map Visualization */}
                <div className="mb-10 p-8 rounded-2xl shadow-sm" style={{
                    background: '#fafaf8',
                    border: '2px solid #d4cfc4'
                }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold" style={{ color: '#4a5568' }}>
                            This Week's Pattern
                        </h2>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" style={{ color: '#9ca3af' }} />
                            <span style={{ color: '#718096', fontSize: '14px' }}>Jan 27 - Feb 2</span>
                        </div>
                    </div>

                    {/* Heat Map Grid */}
                    <div className="space-y-6">
                        {/* Stimming Intensity Row */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 rounded-full" style={{ background: '#6b8e7f' }}></div>
                                <span className="font-medium" style={{ color: '#4a5568', fontSize: '15px' }}>
                                    Stimming Activity
                                </span>
                            </div>
                            <div className="grid grid-cols-7 gap-3">
                                {weekData.map((day, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDay(day)}
                                        className="flex flex-col items-center p-4 rounded-xl transition-all"
                                        style={{
                                            background: getIntensityColor(day.stimming),
                                            border: selectedDay?.date === day.date ? '3px solid #6b8e7f' : '2px solid transparent',
                                            minHeight: '100px',
                                            minWidth: '80px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedDay?.date !== day.date) {
                                                e.target.style.transform = 'scale(1.05)';
                                                e.target.style.borderColor = '#9ca3af';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedDay?.date !== day.date) {
                                                e.target.style.transform = 'scale(1)';
                                                e.target.style.borderColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <span className="text-xs font-medium mb-2" style={{ color: '#718096' }}>
                                            {day.day}
                                        </span>
                                        <span className="text-2xl font-bold mb-1" style={{ color: '#4a5568' }}>
                                            {day.date}
                                        </span>
                                        <div className="flex gap-1">
                                            {[...Array(day.stimming)].map((_, i) => (
                                                <Circle key={i} className="w-2 h-2" fill="#6b8e7f" stroke="none" />
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mood Row */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 rounded-full" style={{ background: '#d4a574' }}></div>
                                <span className="font-medium" style={{ color: '#4a5568', fontSize: '15px' }}>
                                    Overall Mood
                                </span>
                            </div>
                            <div className="grid grid-cols-7 gap-3">
                                {weekData.map((day, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-center p-4 rounded-xl"
                                        style={{
                                            background: '#f0ebe5',
                                            border: '2px solid #e8dfd0',
                                            minHeight: '80px'
                                        }}
                                    >
                                        <span className="text-3xl">{getMoodEmoji(day.mood)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 pt-4" style={{ borderTop: '1px solid #e8e5df' }}>
                            <span className="text-sm font-medium" style={{ color: '#718096' }}>Intensity:</span>
                            <div className="flex items-center gap-2">
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <div key={level} className="flex items-center gap-1">
                                        <div 
                                            className="w-6 h-6 rounded" 
                                            style={{ background: getIntensityColor(level) }}
                                        ></div>
                                        {level === 0 && <span className="text-xs ml-1" style={{ color: '#9ca3af' }}>None</span>}
                                        {level === 4 && <span className="text-xs ml-1" style={{ color: '#9ca3af' }}>High</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Selected Day Details - Progressive Disclosure */}
                    {selectedDay && (
                        <div className="mt-6 p-6 rounded-xl" style={{
                            background: '#e8f0ed',
                            border: '2px solid #b8d4a8'
                        }}>
                            <h3 className="font-semibold mb-3" style={{ color: '#4a5568', fontSize: '16px' }}>
                                {selectedDay.day}, Jan {selectedDay.date}
                            </h3>
                            <div className="space-y-2">
                                <p style={{ color: '#718096', fontSize: '14px' }}>
                                    • 3 stimming behaviors logged
                                </p>
                                <p style={{ color: '#718096', fontSize: '14px' }}>
                                    • Mood: Generally positive {getMoodEmoji(selectedDay.mood)}
                                </p>
                                <p style={{ color: '#718096', fontSize: '14px' }}>
                                    • Sensory load: Moderate
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Log Section - Large Touch Targets */}
                <div className="mb-10 p-8 rounded-2xl shadow-sm" style={{
                    background: '#fafaf8',
                    border: '2px solid #d4cfc4'
                }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold" style={{ color: '#4a5568' }}>
                            Quick Log
                        </h2>
                        <button
                            onClick={() => setShowAddStim(!showAddStim)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all"
                            style={{
                                background: '#6b8e7f',
                                color: '#ffffff',
                                minHeight: '52px',
                                fontSize: '15px'
                            }}
                        >
                            <Plus className="w-5 h-5" />
                            Add Custom
                        </button>
                    </div>

                    {/* Progressive Disclosure - Add Form */}
                    {showAddStim && (
                        <div className="mb-6 p-6 rounded-xl" style={{
                            background: '#f0ebe5',
                            border: '2px solid #d4cfc4'
                        }}>
                            <input
                                type="text"
                                placeholder="Name your stimming behavior..."
                                className="w-full px-5 py-4 rounded-xl mb-3"
                                style={{
                                    background: '#fafaf8',
                                    border: '2px solid #d4cfc4',
                                    color: '#4a5568',
                                    fontSize: '16px',
                                    outline: 'none'
                                }}
                            />
                            <div className="flex gap-3">
                                <button className="px-5 py-3 rounded-xl font-medium" style={{
                                    background: '#6b8e7f',
                                    color: '#ffffff',
                                    fontSize: '14px'
                                }}>
                                    Save
                                </button>
                                <button 
                                    onClick={() => setShowAddStim(false)}
                                    className="px-5 py-3 rounded-xl font-medium" style={{
                                    background: '#e8dfd0',
                                    color: '#718096',
                                    fontSize: '14px'
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Common Stims - Collapsible */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleCategory('common')}
                            className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
                            style={{
                                background: '#f0ebe5',
                                border: '2px solid transparent',
                                minHeight: '60px'
                            }}
                        >
                            <span className="font-medium" style={{ color: '#4a5568', fontSize: '16px' }}>
                                Common Behaviors
                            </span>
                            {expandedCategories.common ? 
                                <ChevronUp className="w-5 h-5" style={{ color: '#9ca3af' }} /> : 
                                <ChevronDown className="w-5 h-5" style={{ color: '#9ca3af' }} />
                            }
                        </button>

                        {expandedCategories.common && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                                {commonStims.map((stim) => (
                                    <button
                                        key={stim.id}
                                        className="flex items-center justify-between p-5 rounded-xl transition-all text-left"
                                        style={{
                                            background: '#fafaf8',
                                            border: '2px solid #e8e5df',
                                            minHeight: '72px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.borderColor = '#6b8e7f';
                                            e.target.style.background = '#e8f0ed';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.borderColor = '#e8e5df';
                                            e.target.style.background = '#fafaf8';
                                        }}
                                    >
                                        <div>
                                            <h4 className="font-semibold mb-1" style={{ 
                                                color: '#4a5568',
                                                fontSize: '15px'
                                            }}>
                                                {stim.name}
                                            </h4>
                                            <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                                                Logged {stim.logged} times this week
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg" style={{ background: '#e8f0ed' }}>
                                            <Plus className="w-5 h-5" style={{ color: '#6b8e7f' }} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Insights Section */}
                <div className="p-8 rounded-2xl shadow-sm" style={{
                    background: 'linear-gradient(135deg, #fff9f0 0%, #fef5e8 100%)',
                    border: '2px solid #f0dab8'
                }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl" style={{ background: '#fce8c8' }}>
                            <TrendingUp className="w-6 h-6" style={{ color: '#d4a574' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2" style={{ color: '#4a5568', fontSize: '17px' }}>
                                Pattern Insight
                            </h3>
                            <p style={{ color: '#718096', fontSize: '15px', lineHeight: '1.6' }}>
                                Your stimming activity tends to increase on days with higher environmental noise. 
                                Consider using noise-canceling headphones during peak hours.
                            </p>
                        </div>
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

                /* Reduced motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }

                /* Increase touch target size on mobile */
                @media (max-width: 768px) {
                    button {
                        min-height: 56px;
                        min-width: 56px;
                    }
                }
            `}</style>
        </div>
    );
};

export default StimmingTracker;

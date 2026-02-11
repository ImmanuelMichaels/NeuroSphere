import React, { useState } from 'react';
import { Volume2, Users, Zap, Battery, Shield, Heart, ChevronRight } from 'lucide-react';
import './Autism.css';

const Autism = () => {
    const [energy, setEnergy] = useState(60);
    const [selectedStrategy, setSelectedStrategy] = useState(null);

    const sensoryStats = [
        { 
            label: 'Sound', 
            icon: Volume2, 
            level: 'High Load',
            value: 7,
            color: '#d4a574',
            bg: '#fff9f0',
            suggestion: 'Noise-canceling headphones recommended'
        },
        { 
            label: 'Social', 
            icon: Users, 
            level: 'Low',
            value: 3,
            color: '#6b8e7f',
            bg: '#e8f0ed',
            suggestion: 'Good energy for connection'
        },
        { 
            label: 'Physical', 
            icon: Zap, 
            level: 'Medium',
            value: 5,
            color: '#b8916d',
            bg: '#f5f0e8',
            suggestion: 'Consider gentle movement'
        },
        { 
            label: 'Energy', 
            icon: Battery, 
            level: `${energy}%`,
            value: energy / 10,
            color: '#6d6b8e',
            bg: '#eae8f0',
            suggestion: energy < 40 ? 'Rest recommended' : 'Stable level'
        }
    ];

    const communicationCards = [
        { text: 'I need quiet', emoji: '🤫', color: '#e8f0ed' },
        { text: 'Too bright', emoji: '💡', color: '#fff9f0' },
        { text: 'I need space', emoji: '🌿', color: '#f0ebe5' },
        { text: 'Feeling good', emoji: '😊', color: '#eae8f0' },
        { text: 'Need help', emoji: '🤝', color: '#fef5e8' },
        { text: 'Break time', emoji: '⏸️', color: '#f5f0e8' }
    ];

    const calmingStrategies = [
        { 
            id: 1, 
            name: 'Deep Pressure', 
            desc: 'Weighted blanket for 15 minutes',
            icon: '🛏️'
        },
        { 
            id: 2, 
            name: 'Quiet Space', 
            desc: 'Noise-canceling + dim lighting',
            icon: '🎧'
        },
        { 
            id: 3, 
            name: 'Sensory Reset', 
            desc: 'Cold water on wrists, deep breaths',
            icon: '💧'
        },
        { 
            id: 4, 
            name: 'Grounding', 
            desc: '5-4-3-2-1 technique',
            icon: '🌱'
        }
    ];

    const getEnergyTheme = (val) => {
        if (val < 30) return { bg: '#fce8c8', color: '#d4a574', text: 'Low - Consider rest and recovery' };
        if (val < 60) return { bg: '#f5f0e8', color: '#b8916d', text: 'Moderate - Pace yourself' };
        return { bg: '#e8f0ed', color: '#6b8e7f', text: 'Good - Feeling balanced' };
    };

    const theme = getEnergyTheme(energy);

    const getGradient = (val) => {
        if (val < 30) return 'linear-gradient(90deg, #d4a574 0%, #b8865f 100%)';
        if (val < 60) return 'linear-gradient(90deg, #b8916d 0%, #a67f5e 100%)';
        return 'linear-gradient(90deg, #6b8e7f 0%, #8daa9d 100%)';
    };

    return (
        <div className="app-container">
            {/* Crisis Button - Always Visible */}
            <button className="help-button">
                <Shield className="help-icon" />
                <span>I Need Help Now</span>
            </button>

            <div className="main-layout-wrapper">
                {/* Header */}
                <div className="section-header">
                    <h1 className="section-title">
                        Sensory Support
                    </h1>
                    <p className="section-subtitle">
                        Tools for regulation and comfort
                    </p>
                </div>
                
                {/* Energy Status - Prominent Visual */}
                <div className=".content-card" >
                   <div className="energy-card">
                        <div 
                            className="energy-icon-wrapper" 
                            style={{ '--energy-bg': theme.bg, '--energy-color': theme.color }}
                            >
                            <Battery className="energy-icon" />
                            </div>
                            
                            <div className="energy-content">
                            <h2 className="energy-title">Energy Level</h2>
                            <p className="energy-status">{theme.text}</p>
                        </div>
                    </div>

                    {/* Large, Easy-to-Use Slider */}
                    <div className="space-y-4">
                        <div className="progress-container">
                            <div 
                            className="progress-bar"
                            style={{
                                '--progress-width': `${energy}%`,
                                '--progress-gradient': getGradient(energy)
                            }}
                            />
                        </div>
                        
                        <div className="slider-group">
                            <span className="slider-label">Adjust:</span>
                            
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={energy}
                                onChange={(e) => setEnergy(Number(e.target.value))}
                                className="slider-input"
                            />
                            
                            <span className="slider-value">
                                {energy}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sensory Dashboard - Card Grid */}
                <div className="mb-10">
                    <h2 className="text-xl font-semibold mb-6" style={{ color: '#4a5568' }}>
                        Current Sensory Load
                    </h2>
                   <div className="stat-grid">
                    {sensoryStats.map((stat, i) => (
                    <div
                        key={i}
                        className="stat-card"
                        style={{
                            '--stat-bg': stat.bg,
                            '--stat-border': `${stat.color}40`,
                            '--stat-icon-bg': `${stat.color}20`,
                            '--stat-badge-bg': `${stat.color}15`,
                            '--stat-badge-border': `${stat.color}30`,
                            '--stat-color': stat.color,
                        }}
                        >
                        <div className="stat-header">
                            <div className="stat-icon-box">
                            <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                            <span className="stat-badge">
                            {stat.level}
                            </span>
                        </div>
                        
                        <h3 className="stat-label">{stat.label}</h3>
                        <p className="stat-suggestion">{stat.suggestion}</p>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Calming Strategies */}
                <div className="dashboard-card">
                    <div className="calming-header">
                        <Heart className="w-6 h-6" style={{ color: '#6b8e7f' }} />
                        <h2 className="text-xl font-semibold" style={{ color: '#4a5568' }}>
                        Calming Strategies
                        </h2>
                    </div>

                    <div className="strategy-grid">
                    {calmingStrategies.map((strategy) => (
                        <button
                        key={strategy.id}
                        onClick={() => setSelectedStrategy(strategy.id)}
                        className={`strategy-btn ${selectedStrategy === strategy.id ? 'selected' : ''}`}
                        >
                        <div className="strategy-icon-emoji">{strategy.icon}</div>
                        
                        <div className="flex-1">
                            <h3 className="strategy-title">{strategy.name}</h3>
                            <p className="strategy-desc">{strategy.desc}</p>
                        </div>

                        <ChevronRight 
                            className="w-5 h-5" 
                            style={{ 
                            color: selectedStrategy === strategy.id ? '#6b8e7f' : '#9ca3af'
                            }} 
                        />
                        </button>
                    ))}
                    </div>

                        {selectedStrategy && (
                            <div className="strategy-callout">
                                <h4 className="strategy-callout-title">
                                    Ready to start?
                                </h4>
                                <div className="action-row">
                                    <button className="btn-action btn-begin">
                                        Begin Strategy
                                    </button>
                                    <button className="btn-action btn-timer">
                                        Set Timer
                                    </button>
                                </div>
                            </div>
                        )}
                </div>

                <div>
                    <h2 className="comm-section-title">Quick Communication</h2>
                    <p className="comm-subtitle">Tap a card to communicate your needs</p>
                    
                    <div className="comm-grid">
                        {communicationCards.map((card, i) => (
                            <button
                                key={i}
                                className="comm-card"
                                style={{ background: card.color }}
                            >
                                <span className="comm-emoji">{card.emoji}</span>
                                <span>{card.text}</span>
                            </button>
                        ))}
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

                input[type="range"] {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                }

                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #6b8e7f;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                input[type="range"]::-moz-range-thumb {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #6b8e7f;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }

                /* Touch target optimization for mobile */
                @media (max-width: 768px) {
                    button {
                        min-height: 56px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Autism;

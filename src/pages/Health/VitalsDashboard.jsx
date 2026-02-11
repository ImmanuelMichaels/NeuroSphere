import React, { useState } from 'react';
import { Activity, Droplet, Heart, TrendingUp, TrendingDown, AlertCircle, Plus, Calendar } from 'lucide-react';
import '../Health/Vitals.css'

const VitalsDashboard = () => {
    const [activeTab, setActiveTab] = useState('glucose');
    const [showAddReading, setShowAddReading] = useState(false);
    const [glucoseValue, setGlucoseValue] = useState('');
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');

    // Mock data for visualization
    const glucoseHistory = [
        { time: '8:00 AM', value: 95, status: 'normal' },
        { time: '12:00 PM', value: 142, status: 'elevated' },
        { time: '3:00 PM', value: 118, status: 'normal' },
        { time: '6:00 PM', value: 135, status: 'borderline' },
        { time: '9:00 PM', value: 105, status: 'normal' }
    ];

    const bpHistory = [
        { time: '8:00 AM', systolic: 128, diastolic: 82, status: 'borderline' },
        { time: '2:00 PM', systolic: 135, diastolic: 88, status: 'elevated' },
        { time: '8:00 PM', systolic: 122, diastolic: 78, status: 'normal' }
    ];

    const getGlucoseStatus = (value) => {
        if (value < 70) return { label: 'Low', color: '#d4a574', bg: '#fff9f0' };
        if (value <= 140) return { label: 'Normal', color: '#6b8e7f', bg: '#e8f0ed' };
        if (value <= 199) return { label: 'Elevated', color: '#b8916d', bg: '#f5f0e8' };
        return { label: 'High', color: '#c87355', bg: '#fce8e8' };
    };

    const getBPStatus = (systolic, diastolic) => {
        if (systolic < 120 && diastolic < 80) return { label: 'Normal', color: '#6b8e7f', bg: '#e8f0ed' };
        if (systolic < 130 && diastolic < 80) return { label: 'Elevated', color: '#b8916d', bg: '#f5f0e8' };
        if (systolic < 140 || diastolic < 90) return { label: 'Stage 1', color: '#d4a574', bg: '#fff9f0' };
        return { label: 'Stage 2', color: '#c87355', bg: '#fce8e8' };
    };

    const handleAddReading = () => {
        // Placeholder for adding reading logic
        setShowAddReading(false);
        setGlucoseValue('');
        setSystolic('');
        setDiastolic('');
    };

    const latestGlucose = glucoseHistory[glucoseHistory.length - 1];
    const latestBP = bpHistory[bpHistory.length - 1];
    const glucoseStatus = getGlucoseStatus(latestGlucose.value);
    const bpStatus = getBPStatus(latestBP.systolic, latestBP.diastolic);

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            <div className="app-stage">
                {/* Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">
                        Vitals Dashboard
                    </h1>
                    <p className="dashboard-subtitle">
                        Track and manage your metabolic and cardiovascular health
                    </p>
                </div>

                {/* Current Status Cards */}
                <div className="vitals-grid">
                    {/* Blood Glucose Card */}
                    <div className="health-summary-card">
                        <div className="card-header-row">
                            <div>
                                <div className="vital-title-group">
                                    <div className="icon-box-glucose">
                                        <Droplet className="w-6 h-6" style={{ color: '#6b8e7f' }} />
                                    </div>
                                    <h3 className="vital-title">
                                        Blood Glucose
                                    </h3>
                                </div>
                                <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                                    Last reading: {latestGlucose.time}
                                </p>
                            </div>
                            <div className="status-pill" style={{
                                background: glucoseStatus.bg,
                                color: glucoseStatus.color,
                                border: `1px solid ${glucoseStatus.color}40`
                            }}>
                                {glucoseStatus.label}
                            </div>
                        </div>

                        <div className="metric-container">
                            <span className="metric-value">
                                {latestGlucose.value}
                            </span>
                            <span className="metric-unit">mg/dL</span>
                        </div>

                        {/* Mini Trend Visualization */}
                        <div className="card-section-divider chart-container">
                            <div className="trend-container trend-bar">
                                {glucoseHistory.slice(-5).map((reading, i) => {
                                    const height = (reading.value / 200) * 100;
                                    const status = getGlucoseStatus(reading.value);
                                    return (
                                        <div key={i} className="chart-bar-container">
                                            <div 
                                                className="chart-barl"
                                                style={{
                                                    height: `${height}%`,
                                                    background: status.color,
                                                    opacity: i === 4 ? 1 : 0.4
                                                }}
                                            ></div>
                                            <span className="chart-label" style={{ color: '#9ca3af' }}>
                                                {reading.time.split(' ')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="reference-badge">
                            <TrendingUp className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            <span className="reference-text">
                                Target range: 70-140 mg/dL
                            </span>
                        </div>
                    </div>

                    {/* Blood Pressure Card */}
                    <div className="health-summary-card">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="vital-card-header">
                                    <div className="vital-icon-container" style={{ background: '#f5f0e8' }}>
                                        <Heart className="heart-icon" style={{ color: '#b8916d' }} />
                                    </div>
                                    <h3 className="vital-header-text" style={{ color: '#4a5568' }}>
                                        Blood Pressure
                                    </h3>
                                </div>
                                <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                                    Last reading: {latestBP.time}
                                </p>
                            </div>
                            <div className={`bp-status-badge ${bpStatus.className}`} style={{
                                background: bpStatus.bg,
                                color: bpStatus.color,
                                border: `1px solid ${bpStatus.color}40`
                            }}>
                                {bpStatus.label}
                            </div>
                        </div>

                        <div className="status-elevated">
                            <span className="bp-reading-container" style={{ color: '#4a5568' }}>
                                {latestBP.systolic}
                            </span>
                            <span className="bp-separator" style={{ color: '#9ca3af' }}>/</span>
                            <span className="bp-number" style={{ color: '#4a5568' }}>
                                {latestBP.diastolic}
                            </span>
                            <span className="bp-unit" style={{ color: '#9ca3af' }}>mmHg</span>
                        </div>

                        {/* Mini Trend Visualization */}
                        <div className="history-row">
                            {bpHistory.slice(-3).map((reading, i) => {
                                const status = getBPStatus(reading.systolic, reading.diastolic);
                                return (
                                    <div key={i} className="history-row">
                                        <span className="text-xs w-16" style={{ color: '#9ca3af' }}>
                                            {reading.time.split(' ')[0]}
                                        </span>
                                        <div className="history-track" style={{ background: '#e8e5df' }}>
                                            <div 
                                                className="history-bar"
                                                style={{
                                                    width: `${(reading.systolic / 200) * 100}%`,
                                                    background: status.color,
                                                    opacity: i === 2 ? 1 : 0.4
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-medium" style={{ color: '#718096' }}>
                                            {reading.systolic}/{reading.diastolic}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="metadata-well">
                            <Activity className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            <span className="text-sm" style={{ color: '#718096' }}>
                                Target: Below 120/80 mmHg
                            </span>
                        </div>
                    </div>
                </div>

                {/* Add Reading Button */}
                <div className="section-spacer-large">
                    <button
                        onClick={() => setShowAddReading(!showAddReading)}
                        className="btn-primary-clinical"
                    >
                        <Plus className="w-6 h-6" />
                        <span>Log New Reading</span>
                    </button>
                </div>

                {/* Add Reading Form - Progressive Disclosure */}
                {showAddReading && (
                    <div className="clinical-form-card">
                        <h3 className="card-title-clinical">
                            Record Vital Signs
                        </h3>

                        {/* Tab Selection */}
                        <div className="tab-row-container">
                            <button
                                onClick={() => setActiveTab('glucose')}
                                className="action-pill"
                                style={{
                                    background: activeTab === 'glucose' ? '#e8f0ed' : '#f0ebe5',
                                    color: activeTab === 'glucose' ? '#6b8e7f' : '#718096',
                                    border: activeTab === 'glucose' ? '2px solid #6b8e7f' : '2px solid transparent',
                                    minHeight: '52px',
                                    fontSize: '15px'
                                }}
                            >
                                Blood Glucose
                            </button>
                            <button
                                onClick={() => setActiveTab('bp')}
                                className="action-pill"
                                style={{
                                    background: activeTab === 'bp' ? '#f5f0e8' : '#f0ebe5',
                                    color: activeTab === 'bp' ? '#b8916d' : '#718096',
                                    border: activeTab === 'bp' ? '2px solid #b8916d' : '2px solid transparent',
                                    minHeight: '52px',
                                    fontSize: '15px'
                                }}
                            >
                                Blood Pressure
                            </button>
                        </div>

                        {/* Glucose Input */}
                        {activeTab === 'glucose' && (
                            <div className="vertical-stack-large">
                                <div>
                                    <label className="label-clinical-primary">
                                        Blood Glucose Level
                                    </label>
                                    <div className="measurement-container">
                                        <input
                                            type="number"
                                            value={glucoseValue}
                                            onChange={(e) => setGlucoseValue(e.target.value)}
                                            placeholder="Enter value"
                                            className="input-glucose"
                                        />
                                        <span className="unit-label">
                                            mg/dL
                                        </span>
                                    </div>
                                </div>

                                <div className="status-well-success">
                                    <AlertCircle className="w-5 h-5" style={{ color: '#6b8e7f' }} />
                                    <p className="text-sm" style={{ color: '#4a5568' }}>
                                        Normal fasting: 70-100 mg/dL • After meals: below 140 mg/dL
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Blood Pressure Input */}
                        {activeTab === 'bp' && (
                            <div className="vertical-stack-large">
                                <div className="metric-grid-split">
                                    <div>
                                        <label className="form-label-clinical">
                                            Systolic (Top)
                                        </label>
                                        <div className="flex-row-centered">
                                            <input
                                                type="number"
                                                value={systolic}
                                                onChange={(e) => setSystolic(e.target.value)}
                                                placeholder="120"
                                                className="w-full px-6 py-4 rounded-xl"
                                                style={{
                                                    background: '#fafaf8',
                                                    border: '2px solid #d4cfc4',
                                                    color: '#4a5568',
                                                    fontSize: '18px',
                                                    outline: 'none',
                                                    minHeight: '56px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label-clinical">
                                            Diastolic (Bottom)
                                        </label>
                                        <div className="input-clinical">
                                            <input
                                                type="number"
                                                value={diastolic}
                                                onChange={(e) => setDiastolic(e.target.value)}
                                                placeholder="80"
                                                className="w-full px-6 py-4 rounded-xl"
                                                style={{
                                                    background: '#fafaf8',
                                                    border: '2px solid #d4cfc4',
                                                    color: '#4a5568',
                                                    fontSize: '18px',
                                                    outline: 'none',
                                                    minHeight: '56px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="insight-alert-box">
                                    <AlertCircle className="w-5 h-5" style={{ color: '#b8916d' }} />
                                    <p className="text-sm" style={{ color: '#4a5568' }}>
                                        Normal: Below 120/80 • Elevated: 120-129/below 80
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="card-footer-actions">
                            <button
                                onClick={handleAddReading}
                                className="btn-secondary"
                            >
                                Save Reading
                            </button>
                            <button
                                onClick={() => setShowAddReading(false)}
                                className="btn-secondary"
                                style={{
                                    background: '#f0ebe5',
                                    color: '#718096',
                                    minHeight: '56px',
                                    fontSize: '15px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Insights Section */}
                <div className="hero-metric-card">
                    <div className="flex items-start gap-4">
                        <div className="icon-well-warm">
                            <Calendar className="icon-warm-accent" style={{ color: '#d4a574' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold-mb-2" style={{ color: '#4a5568', fontSize: '17px' }}>
                                Weekly Pattern Insight
                            </h3>
                            <p style={{ color: '#718096', fontSize: '15px', lineHeight: '1.6' }}>
                                Your afternoon glucose levels tend to spike after lunch. Consider reviewing your carbohydrate intake 
                                during midday meals with the Meal Planner.
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

                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    opacity: 1;
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default VitalsDashboard;

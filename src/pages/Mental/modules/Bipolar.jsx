import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, TrendingUp, Zap, Calendar } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import './Bipolar.css';

const mockData = [
    { day: 'Mon', mood: 4, label: 'Stable' },
    { day: 'Tue', mood: 5, label: 'Good' },
    { day: 'Wed', mood: 4, label: 'Stable' },
    { day: 'Thu', mood: 3, label: 'Low' },
    { day: 'Fri', mood: 6, label: 'Elevated' },
    { day: 'Sat', mood: 7, label: 'High' },
    { day: 'Sun', mood: 5, label: 'Good' },
];

const Bipolar = () => {
    const handleViewPlan = () => {
        // TODO: Implement navigation to prevention plan
        console.log('View prevention plan clicked');
    };

    return (
        <div className="dashboard-stack fade-in">
            <header className="dashboard-header">
                <div className="header-title-group">
                    <h1>Bipolar Management</h1>
                    <p>Track mood patterns and predict episodes.</p>
                </div>
                
                <Button variant="primary" icon={Zap}>
                    Log Current Mood
                </Button>
            </header>

            {/* Grid */}
            <div className="main-dashboard-grid">

                {/* Main Chart */}
                <Card className="card-base col-span-2">
                    <div className="chart-header">
                        <h3 className="chart-title">Mood Stability Prediction</h3>
                        <span className="version-badge">AI MODEL: V2.4</span>
                    </div>

                   <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData}>
                                <defs>
                                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid 
                                    strokeDasharray="3 3" 
                                    stroke="#e2e8f0" 
                                    vertical={false} 
                                />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                />
                                <YAxis hide domain={[0, 10]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px' }} // Minor overrides
                                    itemStyle={{ color: '#0f172a' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="mood" 
                                    stroke="#0d9488" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorMood)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Predictive Alert */}
                <Card className="card-alert-warning">
                    <div className="alert-header">
                        <div className="alert-icon-container">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="alert-content">
                            <h3>Pattern Detected</h3>
                            <p>
                                Your sleep has decreased by 20% over the last 3 days while social activity increased.
                            </p>
                        </div>
                    </div>

                    <div className="risk-meter-container">
                        <div className="risk-meter-label-row">
                            <span className="risk-label">Manic Episode Risk</span>
                            <span className="risk-value">68%</span>
                        </div>
                        <div className="risk-track">
                            <div 
                                className="risk-filler" 
                                style={{ width: '68%' }}
                                role="progressbar"
                                aria-valuenow="68"
                                aria-valuemin="0"
                                aria-valuemax="100"
                            />
                        </div>
                    </div>

                   <button className="btn-prevention" onClick={handleViewPlan}>
                        View Prevention Plan
                    </button>
                </Card>
            </div>

            {/* Therapy & Meds */}
            <div className="stats-grid-container">
                <div className="card-base">
                    <h3 className="card-header-flex">
                        <TrendingUp className="w-4 h-4 text-teal-600" /> 
                        Recent Triggers
                    </h3>
                    
                    <div className="trigger-tag-container">
                        {['Sleep Deprivation', 'Work Stress', 'Caffeine > 300mg'].map(tag => (
                            <span key={tag} className="tag-pill">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="card-base">
                    <h3 className="card-header-flex">
                        <Calendar className="w-4 h-4 text-indigo-600" /> 
                        Medication Adherence
                    </h3>

                    {/* Medication 1 */}
                    <div className="med-row">
                        <div>
                            <p className="med-name">Lithium Carbonate</p>
                            <p className="med-dosage">300mg • 2x Daily</p>
                        </div>
                        <div className="status-circle status-taken">✓</div>
                    </div>

                    {/* Medication 2 */}
                    <div className="med-row">
                        <div>
                            <p className="med-name">Quetiapine</p>
                            <p className="med-dosage">50mg • Bedtime</p>
                        </div>
                        <div className="status-circle status-pending">?</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bipolar;

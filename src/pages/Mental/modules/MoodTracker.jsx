import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Smile,
  Frown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Edit2,
  Trash2,
  Search,
  Download,
  ChevronDown,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Activity,
  X,
  Upload
} from 'lucide-react';
import Button from '../../../components/UI/Button';
import Card from '../../../components/UI/Card';
import { 
  LineChart as RechartsLineChart, 
  Line as RechartsLine, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import './MoodTracker.css';

const MoodTracker = () => {
  // ==================== INITIAL DATA ====================
  const initialMoodEntries = [
    {
      id: 1,
      date: '2025-01-30',
      time: '10:30',
      moodScore: 7,
      moodLabel: 'Happy',
      moodEmoji: '😊',
      energy: 8,
      stress: 3,
      sleep: 7,
      weather: 'sunny',
      activities: ['Exercise', 'Meditation', 'Socializing'],
      triggers: [],
      notes: 'Great day! Exercise in the morning really helped. Feeling motivated and energized.',
      medications: ['Sertraline 100mg'],
      symptoms: ['None']
    },
    {
      id: 2,
      date: '2025-01-29',
      time: '15:15',
      moodScore: 5,
      moodLabel: 'Neutral',
      moodEmoji: '😐',
      energy: 5,
      stress: 5,
      sleep: 6,
      weather: 'cloudy',
      activities: ['Work', 'Reading'],
      triggers: ['Work deadline', 'Less sleep than usual'],
      notes: 'Moderate mood. Work was stressful today but got most tasks done.',
      medications: ['Sertraline 100mg'],
      symptoms: ['Slight anxiety']
    },
    {
      id: 3,
      date: '2025-01-28',
      time: '20:45',
      moodScore: 3,
      moodLabel: 'Sad',
      moodEmoji: '😢',
      energy: 2,
      stress: 8,
      sleep: 5,
      weather: 'rainy',
      activities: ['Rest'],
      triggers: ['Poor sleep', 'Rainy weather', 'Stressful situation at work'],
      notes: 'Difficult day. Low mood and low energy. Feeling overwhelmed by work.',
      medications: ['Sertraline 100mg'],
      symptoms: ['Anxiety', 'Fatigue', 'Difficulty concentrating']
    },
    {
      id: 4,
      date: '2025-01-27',
      time: '14:00',
      moodScore: 8,
      moodLabel: 'Very Happy',
      moodEmoji: '😄',
      energy: 9,
      stress: 2,
      sleep: 8,
      weather: 'sunny',
      activities: ['Exercise', 'Time with friends', 'Outdoor walk'],
      triggers: [],
      notes: 'Excellent day! Spent time with friends and enjoyed outdoor activities.',
      medications: ['Sertraline 100mg'],
      symptoms: ['None']
    }
  ];

  // ==================== STATE MANAGEMENT ====================
  const [moodEntries, setMoodEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('neuropulse_mood_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    }
    return initialMoodEntries;
  });

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click(); 
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    moodScore: 5,
    moodLabel: 'Neutral',
    moodEmoji: '😐',
    energy: 5,
    stress: 5,
    sleep: 6,
    weather: 'sunny',
    activities: [],
    triggers: [],
    notes: '',
    medications: [],
    symptoms: []
  });

  const nextIdRef = useRef(Math.max(...initialMoodEntries.map(e => e.id), 0) + 1);

  // ==================== CONFIGURATION ====================
  const moodOptions = [
    { score: 1, label: 'Very Sad', emoji: '😢', color: '#c87355', bg: '#fce8e8' },
    { score: 2, label: 'Sad', emoji: '😔', color: '#d4a574', bg: '#fff9f0' },
    { score: 3, label: 'Bad', emoji: '😞', color: '#b8916d', bg: '#f5f0e8' },
    { score: 4, label: 'Poor', emoji: '😕', color: '#a0947d', bg: '#ede8dd' },
    { score: 5, label: 'Neutral', emoji: '😐', color: '#8a8480', bg: '#e8e3dc' },
    { score: 6, label: 'Good', emoji: '🙂', color: '#7a9a89', bg: '#e5f0eb' },
    { score: 7, label: 'Happy', emoji: '😊', color: '#6b8e7f', bg: '#e8f0ed' },
    { score: 8, label: 'Very Happy', emoji: '😄', color: '#5a7d70', bg: '#dbe8e0' },
    { score: 9, label: 'Excited', emoji: '🤩', color: '#4a7365', bg: '#cfe8d9' },
    { score: 10, label: 'Elated', emoji: '🥳', color: '#3a6355', bg: '#c1e3cf' }
  ];

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny', icon: Sun },
    { value: 'cloudy', label: 'Cloudy', icon: Cloud },
    { value: 'rainy', label: 'Rainy', icon: CloudRain },
    { value: 'windy', label: 'Windy', icon: Wind }
  ];

  const trendConfig = {
    improving: { colorClass: 'trend-improving', Icon: TrendingUp },
    declining: { colorClass: 'trend-declining', Icon: TrendingDown },
    stable: { colorClass: 'trend-stable', Icon: BarChart3 }
  };

  // ==================== HELPER FUNCTIONS ====================
  const getMoodOption = useCallback((score) => {
    return moodOptions.find(m => m.score === score) || moodOptions[4];
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      moodScore: 5,
      moodLabel: 'Neutral',
      moodEmoji: '😐',
      energy: 5,
      stress: 5,
      sleep: 6,
      weather: 'sunny',
      activities: [],
      triggers: [],
      notes: '',
      medications: [],
      symptoms: []
    });
  }, []);

  // ==================== EFFECTS ====================
  // Persist to localStorage whenever moodEntries changes
  useEffect(() => {
    try {
      localStorage.setItem('neuropulse_mood_entries', JSON.stringify(moodEntries));
    } catch (error) {
      console.error('Error saving mood entries:', error);
    }
  }, [moodEntries]);

  // ==================== COMPUTED VALUES ====================
  const filteredEntries = useMemo(() => {
    let filtered = [...moodEntries];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.notes.toLowerCase().includes(term) ||
        entry.moodLabel.toLowerCase().includes(term) ||
        entry.activities.some(a => a.toLowerCase().includes(term)) ||
        entry.triggers.some(t => t.toLowerCase().includes(term))
      );
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      if (filterPeriod === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filterPeriod === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= cutoffDate;
      });
    }

    // Sort by date and time (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA;
    });
  }, [moodEntries, searchTerm, filterPeriod]);

  const chartData = useMemo(() => {
    return [...filteredEntries]
      .reverse()
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: e.moodScore
      }));
  }, [filteredEntries]);

  const stats = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { avgMood: 0, avgEnergy: 0, avgStress: 0, trend: 'stable' };
    }

    const avgMood = filteredEntries.reduce((sum, e) => sum + e.moodScore, 0) / filteredEntries.length;
    const avgEnergy = filteredEntries.reduce((sum, e) => sum + e.energy, 0) / filteredEntries.length;
    const avgStress = filteredEntries.reduce((sum, e) => sum + e.stress, 0) / filteredEntries.length;

    // Calculate trend (recent 3 vs previous 3 entries)
    let trend = 'stable';
    if (filteredEntries.length >= 6) {
      const recent = filteredEntries.slice(0, 3).reduce((sum, e) => sum + e.moodScore, 0) / 3;
      const previous = filteredEntries.slice(3, 6).reduce((sum, e) => sum + e.moodScore, 0) / 3;
      if (recent > previous + 0.5) trend = 'improving';
      else if (recent < previous - 0.5) trend = 'declining';
    }

    return {
      avgMood: avgMood.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      avgStress: avgStress.toFixed(1),
      trend
    };
  }, [filteredEntries]);


  // ==================== EVENT HANDLERS ====================
  const handleAddEntry = useCallback(() => {
    if (editingId) {
      setMoodEntries(prev =>
        prev.map(entry =>
          entry.id === editingId ? { ...entry, ...formData } : entry
        )
      );
      setEditingId(null);
    } else {
      const newEntry = {
        ...formData,
        id: nextIdRef.current++
      };
      setMoodEntries(prev => [newEntry, ...prev]);
    }
    resetForm();
    setShowAddForm(false);
  }, [editingId, formData, resetForm]);

  const handleEditEntry = useCallback((entry) => {
    setFormData(entry);
    setEditingId(entry.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteEntry = useCallback((id) => {
    if (window.confirm('Delete this mood entry? This cannot be undone.')) {
      setMoodEntries(prev => prev.filter(entry => entry.id !== id));
      if (expandedEntry === id) {
        setExpandedEntry(null);
      }
    }
  }, [expandedEntry]);

  const downloadReport = useCallback(() => {
    const avgMood = stats.avgMood;
    const avgEnergy = stats.avgEnergy;
    const avgStress = stats.avgStress;

    // Calculate top activities
    const activityCounts = filteredEntries
      .flatMap(e => e.activities)
      .reduce((acc, act) => {
        acc[act] = (acc[act] || 0) + 1;
        return acc;
      }, {});

    const topActivities = Object.entries(activityCounts).length > 0
      ? Object.entries(activityCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([act, count]) => `${act}: ${count} times`)
          .join('\n')
      : 'No activities tracked';

    // Calculate top triggers
    const triggerCounts = filteredEntries
      .flatMap(e => e.triggers)
      .reduce((acc, trigger) => {
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      }, {});

    const topTriggers = Object.entries(triggerCounts).length > 0
      ? Object.entries(triggerCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([trigger, count]) => `${trigger}: ${count} times`)
          .join('\n')
      : 'No triggers tracked';

    const reportText = `
NEUROPULSE MOOD TRACKER REPORT
${'='.repeat(60)}
Report Date: ${new Date().toLocaleDateString()}
Period: ${filterPeriod === 'week' ? 'Last 7 days' : filterPeriod === 'month' ? 'Last 30 days' : 'All time'}
Total Entries: ${filteredEntries.length}

STATISTICS
${'-'.repeat(60)}
Average Mood Score: ${avgMood}/10
Average Energy Level: ${avgEnergy}/10
Average Stress Level: ${avgStress}/10
Mood Trend: ${stats.trend}

TOP ACTIVITIES
${'-'.repeat(60)}
${topActivities}

TOP TRIGGERS
${'-'.repeat(60)}
${topTriggers}

MOOD ENTRIES
${'='.repeat(60)}
${filteredEntries
  .map(e => `
Date: ${new Date(e.date).toLocaleDateString()} at ${e.time}
Mood: ${e.moodLabel} (${e.moodScore}/10) ${e.moodEmoji}
Energy: ${e.energy}/10 | Stress: ${e.stress}/10 | Sleep: ${e.sleep}/10
Weather: ${e.weather}
Activities: ${e.activities.join(', ') || 'None'}
Triggers: ${e.triggers.join(', ') || 'None'}
Notes: ${e.notes || 'No notes'}
`)
  .join('\n' + '-'.repeat(60) + '\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neuropulse-mood-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredEntries, filterPeriod, stats]);

  const exportJSON = useCallback(() => {
    try {
      const data = JSON.stringify(moodEntries, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `neuropulse-mood-entries-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Failed to export data. Please try again.');
    }
  }, [moodEntries]);

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(moodEntries.map(m => m.id));
          const newEntries = parsed.filter(p => p && p.id && !existingIds.has(p.id));
          
          if (newEntries.length > 0) {
            setMoodEntries(prev => [...prev, ...newEntries].sort((a, b) => {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateB - dateA;
            }));
            alert(`Successfully imported ${newEntries.length} mood entries!`);
          } else {
            alert('No new entries to import. All entries already exist.');
          }
        } else {
          alert('Invalid file format. Please upload a valid JSON file.');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Failed to import file. Please check the file format and try again.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [moodEntries]);

  const clearData = useCallback(() => {
    if (window.confirm('Clear all mood entries? This cannot be undone. Consider exporting your data first.')) {
      setMoodEntries([]);
      localStorage.removeItem('neuropulse_mood_entries');
      setExpandedEntry(null);
      setSearchTerm('');
      setFilterPeriod('all');
    }
  }, []);

  const currentTrend = trendConfig[stats.trend] || trendConfig.stable;
  const TrendIcon = currentTrend.Icon;


  // ==================== RENDER ====================
  return (
    <div className="app-root">
      <div className="main-layout-wrapper">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold mb-3" style={{ color: '#4a5568' }}>
            Mood Tracker
          </h1>
          <p style={{ color: '#718096', fontSize: '16px' }}>
            Track your daily mood, emotions, and mental health patterns
          </p>
        </div>

        {/* Mood Trend Chart */}
        {chartData.length > 0 && (
          <Card className="heading-container">
            <h2 className="card-title">
              Mood Trend Over Time
            </h2>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e5df" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#718096', fontSize: 12 }}
                    stroke="#d4cfc4"
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fill: '#718096', fontSize: 12 }}
                    stroke="#d4cfc4"
                  />
                  <Tooltip 
                    contentStyle={{
                      background: '#fafaf8',
                      border: '1px solid #d4cfc4',
                      borderRadius: '8px'
                    }}
                  />
                  <RechartsLine 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6b8e7f" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6b8e7f' }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="kpi-grid">
          {/* Average Mood */}
          <div className="dashboard-card">
            <div className="flex-between">
              <div>
                <p className="stat-label">Average Mood</p>
                <p className="stat-value">{stats.avgMood}</p>
                <p className="stat-unit">out of 10</p>
              </div>
              <Smile className="stat-icon" style={{ color: '#6b8e7f', opacity: 0.6 }} />
            </div>
          </div>

          {/* Energy Level */}
          <div className="card-kpi-energy">
            <div className="flex-between">
              <div>
                <p className="stat-label">Energy Level</p>
                <p className="stat-value text-energy">{stats.avgEnergy}</p>
                <p className="stat-unit">out of 10</p>
              </div>
              <Activity className="icon-energy" style={{ opacity: 0.6 }} />
            </div>
          </div>

          {/* Stress Level */}
          <div className="card-kpi-base">
            <div className="flex-between">
              <div>
                <p className="stat-label">Stress Level</p>
                <p className="stat-value text-stress">{stats.avgStress}</p>
                <p className="stat-unit">out of 10</p>
              </div>
              <AlertCircle className="icon-stress" style={{ opacity: 0.6 }} />
            </div>
          </div>

          {/* Mood Trend */}
          <div className="card-kpi-trend">
            <div className="flex-between">
              <div>
                <p className="stat-label">Mood Trend</p>
                <p className={`trend-text ${currentTrend.colorClass}`}>
                  {stats.trend}
                </p>
                <p className="stat-unit">
                  {filteredEntries.length} entries
                </p>
              </div>
              <TrendIcon className={`stat-icon ${currentTrend.colorClass}`} style={{ opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="control-bar">
          {/* Search */}
          <div className="search-wrapper">
            <Search className="search-icon-overlay" />
            <input
              type="text"
              placeholder="Search mood entries..."
              className="search-input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Period Filters */}
          <div className="filter-group">
            {['all', 'week', 'month'].map(period => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`filter-btn ${
                  filterPeriod === period ? 'filter-btn-primary' : 'filter-btn-secondary'
                }`}
              >
                {period === 'all' ? 'All Time' : 
                period === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          {/* Action Buttons */}
            <div className="import-container">
              {/* The Hidden Native Input */}
              <input 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                type="file" 
                accept="application/json" 
                style={{ display: 'none' }} 
              />

              {/* The Pretty Custom Button */}
              <button 
                type="button"
                onClick={handleButtonClick}
                className="btn-secondary"
              >
                <Upload className="button-inner icon-style" />
                Import Data (.json)
              </button>

            </div>
          
          <div className="chip-container">
            <Button onClick={downloadReport} variant="secondary" className="btn-secondary">
              <Download className="button-inner icon-style" />
              Report
            </Button>
            <Button onClick={exportJSON} variant="secondary" className="btn-secondary">
              <Download className="button-inner icon-style" />
              Export
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="btn-secondary">
              <Cloud className="button-inner icon-style" />
              Import
            </Button>
            <Button onClick={clearData} variant="danger" className="btn-secondary">
              Clear All
            </Button>
            <Button 
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
                resetForm();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              variant="primary"
              className="btn-secondary"
            >
              <Plus className="button-inner icon-style" />
              Log Mood
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="card-spotlight">
            <div className="form-header">
              <h2 className="form-title">
                {editingId ? 'Edit Mood Entry' : 'Log Your Mood'}
              </h2>
              
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="close-button"
                aria-label="Close form"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="form-input-container">
                
                {/* Date */}
                <div className="this-form-group">
                  <label htmlFor="date" className="form-label-inner">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#d4cfc4] bg-[#fafaf8] focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Time */}
                <div className="this-form-group">
                  <label htmlFor="time" className="form-label-inner">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time
                  </label>
                  <input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#d4cfc4] bg-[#fafaf8] focus:outline-none focus:border-teal-500"
                  />
                </div>

              </div>
            </div>

            <div className="edt-btnn-group">
              <Button onClick={handleAddEntry} variant="primary" className="flex-1 md:flex-none">
                {editingId ? 'Update Entry' : 'Save Entry'}
              </Button>
              <Button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }} 
                variant="secondary"
                className="edt-cancel"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Mood Entries Timeline */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="empty-state-card">
              <Smile className="empty-state-icon" />
              <p className="empty-state-title">No mood entries found</p>
              <p className="empty-state-subtext">
                {searchTerm ? 'Try adjusting your search' : 'Start tracking your mood today!'}
              </p>
              
              {!searchTerm && (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="btnn-primary"
                >
                  + Log First Entry
                </button>
              )}
            </div>
            ) : (
            filteredEntries.map(entry => {
              const moodOption = getMoodOption(entry.moodScore);
              const isExpanded = expandedEntry === entry.id;

              return (
                  <div 
                    role="button"
                    tabIndex={0}
                    className="mood-card"
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    onKeyDown={(e) => (e.key === 'Enter' && setExpandedEntry(isExpanded ? null : entry.id))}
                  >
                  {/* Entry Header */}
                  <div 
                    className="card-body"
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    >
                    <div className="card-header-flex">
                      <div className="card-header-flex">
                        <div className="entry-header">
                          <span className="text-5xl" aria-hidden="true">{moodOption.emoji}</span>
                          
                            <div className="content-area">
                              <div className="action-area">
                                <h3 className="text-2xl font-semibold text-slate-700">
                                  {moodOption.label}
                                </h3>
                                <span
                                  className="mood-score-pill"
                                  style={{
                                    background: moodOption.bg,
                                    color: moodOption.color,
                                    border: `2px solid ${moodOption.color}`
                                  }}
                                >
                                  {entry.moodScore}/10
                                </span>
                              </div>

                              <div className="meta-info-row">
                                <time className="time-flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(entry.date).toLocaleDateString()}
                                </time>
                                <time className="time-flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {entry.time}
                                </time>
                              </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-6 text-sm">
                          <div style={{ color: '#d4a574' }}>
                            <span className="font-medium">Energy:</span> <span className="font-bold">{entry.energy}/10</span>
                          </div>
                          <div style={{ color: '#c87355' }}>
                            <span className="font-medium">Stress:</span> <span className="font-bold">{entry.stress}/10</span>
                          </div>
                          <div style={{ color: '#6b8e7f' }}>
                            <span className="font-medium">Sleep:</span> <span className="font-bold">{entry.sleep}/10</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="btn-flex-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                          className="btn-child p-2 hover:bg-slate-100 rounded-lg transition"
                          title="Edit entry"
                        >
                          <Edit2 className="w-5 h-5" style={{ color: '#718096' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="btn-child p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-5 h-5" style={{ color: '#c87355' }} />
                        </button>
                        <button
                          className="btn-child p-2 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedEntry(isExpanded ? null : entry.id);
                          }}
                        >
                          <ChevronDown
                            className="w-5 h-5"
                            style={{
                              color: '#718096',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                              transition: 'transform 0.3s'
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div 
                      className="activity-box px-6 pb-6 pt-4 space-y-4"
                      style={{ borderTop: '2px solid #e8e5df' }}
                    >
                      {/* Activities */}
                      {entry.activities.length > 0 && (
                        <div>
                          <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            ACTIVITIES
                          </p>
                          <div className="doings-flex flex-wrap gap-2">
                            {entry.activities.map((activity, idx) => (
                              <span
                                key={idx}
                                className="doings-inner px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                  background: '#e8f0ed',
                                  color: '#6b8e7f',
                                  border: '1px solid #6b8e7f40'
                                }}
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Triggers */}
                      {entry.triggers.length > 0 && (
                        <div>
                          <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            POTENTIAL TRIGGERS
                          </p>
                          <div className="doings-flex flex flex-wrap gap-2">
                            {entry.triggers.map((trigger, idx) => (
                              <span
                                key={idx}
                                className="doings-inner px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                  background: '#fce8e8',
                                  color: '#c87355',
                                  border: '1px solid #c8735540'
                                }}
                              >
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Symptoms */}
                      {entry.symptoms.length > 0 && entry.symptoms[0] !== 'None' && (
                        <div>
                          <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            SYMPTOMS
                          </p>
                          <div className="doings-flex flex flex-wrap gap-2">
                            {entry.symptoms.map((symptom, idx) => (
                              <span
                                key={idx}
                                className="doings-inner px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                  background: '#fff9f0',
                                  color: '#d4a574',
                                  border: '1px solid #d4a57440'
                                }}
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Weather */}
                      <div>
                        <p className="metadata-label">Weather</p>
                        <div className="metadata-value-row">
                          {(() => {
                            const weatherInfo = weatherOptions.find(w => w.value === entry.weather) || { icon: Cloud, label: 'Unknown' };
                            return (
                              <>
                                <weatherInfo.icon className="metadata-icon" />
                                <span className="capitalize font-medium text-slate-700" style={{ marginLeft: '8px' }}>
                                  {weatherInfo.label}
                                </span>
                              </>
                            );
                          })()}
                          <p className="capitalize font-medium text-slate-700">
                            {entry.weather || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <div 
                          className="note p-4 rounded-xl" 
                          style={{ 
                            background: '#fafaf8', 
                            border: '2px solid #d4cfc4' 
                          }}
                        >
                          <p className=" font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            NOTES
                          </p>
                          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '15px' }}>
                            {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  Award,
  X,
  Edit2,
  Trash2,
  Search,
  Download,
  ChevronDown,
  Zap,
  Phone,
  MessageSquare,
  BookOpen,
  Users,
  Heart,
  Brain,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import Button from '../../../components/UI/Button';
import Card from '../../../components/UI/Card';
import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

const GamblingAddictionTracker = () => {
  // ==================== INITIAL DATA ====================
  const initialEntries = [
    {
      id: 1,
      date: '2025-01-30',
      time: '14:30',
      type: 'urge_resisted',
      urgeIntensity: 7,
      resistanceStrength: 8,
      triggers: ['Saw sports betting ad', 'Friend mentioned winnings'],
      copingStrategies: ['Called accountability partner', 'Went for a walk'],
      mood: 'anxious',
      notes: 'Strong urge to bet on weekend games. Called my sponsor instead. Proud of myself.',
      moneyNotSpent: 5000, // Naira
      daysClean: 15
    },
    {
      id: 2,
      date: '2025-01-28',
      time: '20:15',
      type: 'relapse',
      amountLost: 8000,
      amountWon: 0,
      duration: 45, // minutes
      triggers: ['Boredom', 'Stress from work'],
      mood: 'depressed',
      notes: 'Relapsed after stressful day at work. Bet on virtual games. Feel terrible.',
      daysClean: 0
    },
    {
      id: 3,
      date: '2025-01-25',
      time: '16:00',
      type: 'urge_resisted',
      urgeIntensity: 9,
      resistanceStrength: 6,
      triggers: ['Payday', 'Passed betting shop'],
      copingStrategies: ['Distraction technique', 'Called helpline'],
      mood: 'stressed',
      notes: 'Very strong urge on payday. Almost went in but called helpline instead.',
      moneyNotSpent: 10000,
      daysClean: 12
    }
  ];

  // ==================== STATE MANAGEMENT ====================
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('neuropulse_gambling_tracker');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.error('Error loading gambling entries:', error);
    }
    return initialEntries;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showEmergencyHelp, setShowEmergencyHelp] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: 'urge_resisted',
    urgeIntensity: 5,
    resistanceStrength: 5,
    amountLost: 0,
    amountWon: 0,
    duration: 0,
    triggers: [],
    copingStrategies: [],
    mood: 'neutral',
    notes: '',
    moneyNotSpent: 0
  });

  const fileInputRef = useRef(null);
  const nextIdRef = useRef(Math.max(...initialEntries.map(e => e.id), 0) + 1);

  // ==================== CONFIGURATION ====================
  const entryTypes = [
    { value: 'urge_resisted', label: 'Resisted Urge', icon: Shield, color: '#6b8e7f', bg: '#e8f0ed' },
    { value: 'relapse', label: 'Relapse', icon: AlertTriangle, color: '#c87355', bg: '#fce8e8' },
    { value: 'close_call', label: 'Close Call', icon: Zap, color: '#d4a574', bg: '#fff9f0' }
  ];

  const triggerOptions = [
    'Boredom', 'Stress from work', 'Financial pressure', 'Saw betting ad',
    'Friend mentioned gambling', 'Payday', 'Passed betting shop',
    'Online ads', 'Loneliness', 'Celebration mood', 'Depression',
    'Relationship issues', 'Free time', 'Alcohol use'
  ];

  const copingStrategyOptions = [
    'Called accountability partner', 'Went for a walk', 'Exercise',
    'Meditation', 'Called helpline', 'Distraction technique',
    'Journaling', 'Prayer', 'Talked to family', 'Read recovery material',
    'Attended support group', 'Left the situation', 'Deep breathing'
  ];

  const moodOptions = [
    'happy', 'neutral', 'anxious', 'stressed', 'depressed', 
    'excited', 'bored', 'angry', 'confident', 'ashamed'
  ];

  const emergencyHotlines = [
    { name: 'Gamblers Anonymous Nigeria', number: '08012345678', type: 'local' },
    { name: 'National Gambling Helpline', number: '0800-GAMBLER', type: 'national' },
    { name: 'Crisis Helpline', number: '112', type: 'emergency' },
    { name: 'Mentally Aware Nigeria', number: '09010000000', type: 'mental_health' }
  ];

  // ==================== HELPER FUNCTIONS ====================
  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      type: 'urge_resisted',
      urgeIntensity: 5,
      resistanceStrength: 5,
      amountLost: 0,
      amountWon: 0,
      duration: 0,
      triggers: [],
      copingStrategies: [],
      mood: 'neutral',
      notes: '',
      moneyNotSpent: 0
    });
  }, []);

  const calculateDaysClean = useCallback(() => {
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA;
    });

    const lastRelapse = sortedEntries.find(e => e.type === 'relapse');
    
    if (!lastRelapse) {
      // No relapses, calculate from first entry
      const firstEntry = sortedEntries[sortedEntries.length - 1];
      if (firstEntry) {
        const daysSinceStart = Math.floor(
          (new Date() - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24)
        );
        return daysSinceStart;
      }
      return 0;
    }

    const daysSinceRelapse = Math.floor(
      (new Date() - new Date(lastRelapse.date)) / (1000 * 60 * 60 * 24)
    );
    return daysSinceRelapse;
  }, [entries]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    try {
      localStorage.setItem('neuropulse_gambling_tracker', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving gambling entries:', error);
    }
  }, [entries]);

  // ==================== COMPUTED VALUES ====================
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.notes.toLowerCase().includes(term) ||
        entry.triggers?.some(t => t.toLowerCase().includes(term)) ||
        entry.copingStrategies?.some(c => c.toLowerCase().includes(term))
      );
    }

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

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA;
    });
  }, [entries, searchTerm, filterPeriod]);

  const stats = useMemo(() => {
    const daysClean = calculateDaysClean();
    const totalResisted = filteredEntries.filter(e => e.type === 'urge_resisted').length;
    const totalRelapses = filteredEntries.filter(e => e.type === 'relapse').length;
    const totalMoneySaved = filteredEntries
      .filter(e => e.moneyNotSpent)
      .reduce((sum, e) => sum + (e.moneyNotSpent || 0), 0);
    const totalMoneyLost = filteredEntries
      .filter(e => e.amountLost)
      .reduce((sum, e) => sum + (e.amountLost || 0), 0);
    
    const avgUrgeIntensity = filteredEntries
      .filter(e => e.urgeIntensity)
      .reduce((sum, e) => sum + e.urgeIntensity, 0) / 
      (filteredEntries.filter(e => e.urgeIntensity).length || 1);

    const resistanceRate = totalResisted + totalRelapses > 0
      ? ((totalResisted / (totalResisted + totalRelapses)) * 100).toFixed(1)
      : 0;

    return {
      daysClean,
      totalResisted,
      totalRelapses,
      totalMoneySaved,
      totalMoneyLost,
      avgUrgeIntensity: avgUrgeIntensity.toFixed(1),
      resistanceRate,
      netSavings: totalMoneySaved - totalMoneyLost
    };
  }, [filteredEntries, calculateDaysClean]);

  const chartData = useMemo(() => {
    return [...filteredEntries]
      .reverse()
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        urgeIntensity: e.urgeIntensity || 0,
        resistanceStrength: e.resistanceStrength || 0,
        type: e.type
      }));
  }, [filteredEntries]);

  const moneyChartData = useMemo(() => {
    return [...filteredEntries]
      .reverse()
      .filter(e => e.moneyNotSpent || e.amountLost)
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        saved: e.moneyNotSpent || 0,
        lost: e.amountLost || 0
      }));
  }, [filteredEntries]);

  // ==================== EVENT HANDLERS ====================
  const handleAddEntry = useCallback(() => {
    if (editingId) {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === editingId ? { ...entry, ...formData } : entry
        )
      );
      setEditingId(null);
    } else {
      const newEntry = {
        ...formData,
        id: nextIdRef.current++,
        daysClean: formData.type === 'relapse' ? 0 : calculateDaysClean()
      };
      setEntries(prev => [newEntry, ...prev]);
    }
    resetForm();
    setShowAddForm(false);
  }, [editingId, formData, resetForm, calculateDaysClean]);

  const handleEditEntry = useCallback((entry) => {
    setFormData(entry);
    setEditingId(entry.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteEntry = useCallback((id) => {
    if (window.confirm('Delete this entry? This cannot be undone.')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      if (expandedEntry === id) {
        setExpandedEntry(null);
      }
    }
  }, [expandedEntry]);

  const toggleTrigger = useCallback((trigger) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger]
    }));
  }, []);

  const toggleCopingStrategy = useCallback((strategy) => {
    setFormData(prev => ({
      ...prev,
      copingStrategies: prev.copingStrategies.includes(strategy)
        ? prev.copingStrategies.filter(s => s !== strategy)
        : [...prev.copingStrategies, strategy]
    }));
  }, []);

  const downloadReport = useCallback(() => {
    const reportText = `
NEUROPULSE GAMBLING ADDICTION RECOVERY TRACKER
${'='.repeat(70)}
Report Date: ${new Date().toLocaleDateString()}
Period: ${filterPeriod === 'week' ? 'Last 7 days' : filterPeriod === 'month' ? 'Last 30 days' : 'All time'}

RECOVERY STATISTICS
${'-'.repeat(70)}
Days Clean: ${stats.daysClean} days
Total Urges Resisted: ${stats.totalResisted}
Total Relapses: ${stats.totalRelapses}
Resistance Rate: ${stats.resistanceRate}%
Average Urge Intensity: ${stats.avgUrgeIntensity}/10

FINANCIAL IMPACT
${'-'.repeat(70)}
Money Saved (urges resisted): ₦${stats.totalMoneySaved.toLocaleString()}
Money Lost (relapses): ₦${stats.totalMoneyLost.toLocaleString()}
Net Savings: ₦${stats.netSavings.toLocaleString()}

TOP TRIGGERS
${'-'.repeat(70)}
${Object.entries(
  filteredEntries
    .flatMap(e => e.triggers || [])
    .reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {})
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([trigger, count]) => `${trigger}: ${count} times`)
  .join('\n') || 'No triggers tracked'}

MOST EFFECTIVE COPING STRATEGIES
${'-'.repeat(70)}
${Object.entries(
  filteredEntries
    .filter(e => e.type === 'urge_resisted')
    .flatMap(e => e.copingStrategies || [])
    .reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {})
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([strategy, count]) => `${strategy}: ${count} times`)
  .join('\n') || 'No strategies tracked'}

DETAILED ENTRIES
${'='.repeat(70)}
${filteredEntries
  .map(e => `
Date: ${new Date(e.date).toLocaleDateString()} at ${e.time}
Type: ${e.type.replace('_', ' ').toUpperCase()}
${e.urgeIntensity ? `Urge Intensity: ${e.urgeIntensity}/10` : ''}
${e.resistanceStrength ? `Resistance Strength: ${e.resistanceStrength}/10` : ''}
${e.amountLost ? `Amount Lost: ₦${e.amountLost.toLocaleString()}` : ''}
${e.moneyNotSpent ? `Money Not Spent: ₦${e.moneyNotSpent.toLocaleString()}` : ''}
Triggers: ${e.triggers?.join(', ') || 'None'}
Coping Strategies: ${e.copingStrategies?.join(', ') || 'None'}
Mood: ${e.mood}
Notes: ${e.notes || 'No notes'}
`)
  .join('\n' + '-'.repeat(70) + '\n')}

EMERGENCY RESOURCES
${'-'.repeat(70)}
${emergencyHotlines.map(h => `${h.name}: ${h.number}`).join('\n')}

Stay strong! Every day clean is a victory. 💪
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gambling-recovery-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredEntries, filterPeriod, stats]);

  const exportJSON = useCallback(() => {
    try {
      const data = JSON.stringify(entries, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gambling-recovery-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Failed to export data. Please try again.');
    }
  }, [entries]);

  const getEntryTypeConfig = (type) => {
    return entryTypes.find(t => t.value === type) || entryTypes[0];
  };

  // ==================== RENDER ====================
  return (
    <div className="app-root">
      <div className="main-layout-wrapper">
        {/* Header */}
        <div className="mb-10">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-3xl font-semibold mb-3" style={{ color: '#4a5568' }}>
                Gambling Addiction Recovery Tracker
              </h1>
              <p style={{ color: '#718096', fontSize: '16px' }}>
                Track your recovery journey, resist urges, and celebrate victories
              </p>
            </div>
            <Button
              onClick={() => setShowEmergencyHelp(true)}
              variant="danger"
              className="flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Emergency Help
            </Button>
          </div>
        </div>

        {/* Emergency Help Modal */}
        {showEmergencyHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold" style={{ color: '#c87355' }}>
                  <AlertTriangle className="w-6 h-6 inline mr-2" />
                  Emergency Support Resources
                </h2>
                <button
                  onClick={() => setShowEmergencyHelp(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-6 h-6" style={{ color: '#718096' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: '#fce8e8', border: '2px solid #c87355' }}>
                  <p className="font-semibold mb-2" style={{ color: '#c87355' }}>
                    If you're experiencing a gambling crisis, help is available NOW:
                  </p>
                </div>

                {emergencyHotlines.map((hotline, idx) => (
                  <a
                    key={idx}
                    href={`tel:${hotline.number}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:shadow-md transition"
                    style={{ background: '#e8f0ed', border: '2px solid #6b8e7f' }}
                  >
                    <Phone className="w-6 h-6" style={{ color: '#6b8e7f' }} />
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#4a5568' }}>
                        {hotline.name}
                      </p>
                      <p className="text-sm" style={{ color: '#718096' }}>
                        {hotline.type === 'local' ? 'Local Support' : 
                         hotline.type === 'national' ? 'National Helpline' :
                         hotline.type === 'emergency' ? 'Emergency Line' : 'Mental Health'}
                      </p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: '#6b8e7f' }}>
                      {hotline.number}
                    </p>
                  </a>
                ))}

                <div className="p-4 rounded-xl" style={{ background: '#fff9f0' }}>
                  <p className="text-sm" style={{ color: '#718096' }}>
                    <strong>You're not alone.</strong> Recovery is possible. These resources are here to help you 24/7.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recovery Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Days Clean */}
          <Card className="p-6" style={{ background: 'linear-gradient(135deg, #e8f0ed 0%, #d0e8db 100%)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#4a7365' }}>
                  Days Clean
                </p>
                <p className="text-4xl font-bold mb-1" style={{ color: '#6b8e7f' }}>
                  {stats.daysClean}
                </p>
                <p className="text-xs" style={{ color: '#5a7d6f' }}>
                  Keep going strong! 💪
                </p>
              </div>
              <Award className="w-10 h-10" style={{ color: '#6b8e7f', opacity: 0.7 }} />
            </div>
          </Card>

          {/* Resistance Rate */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  Resistance Rate
                </p>
                <p className="text-4xl font-bold mb-1" style={{ color: '#6b8e7f' }}>
                  {stats.resistanceRate}%
                </p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  {stats.totalResisted} urges resisted
                </p>
              </div>
              <Shield className="w-10 h-10" style={{ color: '#6b8e7f', opacity: 0.6 }} />
            </div>
          </Card>

          {/* Money Saved */}
          <Card className="p-6" style={{ background: 'linear-gradient(135deg, #e8f0ed 0%, #e5f0eb 100%)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  Money Saved
                </p>
                <p className="text-3xl font-bold mb-1" style={{ color: '#6b8e7f' }}>
                  ₦{stats.totalMoneySaved.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  By resisting urges
                </p>
              </div>
              <DollarSign className="w-10 h-10" style={{ color: '#6b8e7f', opacity: 0.6 }} />
            </div>
          </Card>

          {/* Net Savings */}
          <Card className="p-6" style={{ 
            background: stats.netSavings >= 0 
              ? 'linear-gradient(135deg, #e8f0ed 0%, #d0e8db 100%)'
              : 'linear-gradient(135deg, #fce8e8 0%, #fef5e8 100%)'
          }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  Net Savings
                </p>
                <p className="text-3xl font-bold mb-1" style={{ 
                  color: stats.netSavings >= 0 ? '#6b8e7f' : '#c87355' 
                }}>
                  ₦{Math.abs(stats.netSavings).toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  {stats.netSavings >= 0 ? 'Ahead!' : 'Lost in relapses'}
                </p>
              </div>
              {stats.netSavings >= 0 ? (
                <TrendingUp className="w-10 h-10" style={{ color: '#6b8e7f', opacity: 0.6 }} />
              ) : (
                <TrendingDown className="w-10 h-10" style={{ color: '#c87355', opacity: 0.6 }} />
              )}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Urge Intensity Chart */}
          {chartData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#4a5568' }}>
                Urge Intensity & Resistance
              </h2>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e5df" />
                    <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 12 }} stroke="#d4cfc4" />
                    <YAxis domain={[0, 10]} tick={{ fill: '#718096', fontSize: 12 }} stroke="#d4cfc4" />
                    <Tooltip contentStyle={{ background: '#fafaf8', border: '1px solid #d4cfc4', borderRadius: '8px' }} />
                    <Legend />
                    <RechartsLine 
                      type="monotone" 
                      dataKey="urgeIntensity" 
                      stroke="#c87355" 
                      strokeWidth={2} 
                      name="Urge Intensity"
                      dot={{ r: 4 }}
                    />
                    <RechartsLine 
                      type="monotone" 
                      dataKey="resistanceStrength" 
                      stroke="#6b8e7f" 
                      strokeWidth={2} 
                      name="Resistance"
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Money Chart */}
          {moneyChartData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#4a5568' }}>
                Money Saved vs Lost
              </h2>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moneyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e5df" />
                    <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 12 }} stroke="#d4cfc4" />
                    <YAxis tick={{ fill: '#718096', fontSize: 12 }} stroke="#d4cfc4" />
                    <Tooltip contentStyle={{ background: '#fafaf8', border: '1px solid #d4cfc4', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="saved" fill="#6b8e7f" name="Saved (₦)" />
                    <Bar dataKey="lost" fill="#c87355" name="Lost (₦)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:border-teal-500 transition"
              style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'week', 'month'].map(period => (
              <Button
                key={period}
                variant={filterPeriod === period ? 'primary' : 'secondary'}
                onClick={() => setFilterPeriod(period)}
                className="px-4 py-2"
              >
                {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'This Month'}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={downloadReport} variant="secondary" className="px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Report
            </Button>
            <Button onClick={exportJSON} variant="secondary" className="px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
                resetForm();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              variant="primary"
              className="px-4 py-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Log Entry
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-8 p-6" style={{ background: 'linear-gradient(to br, #fafaf8, #f5f3ef)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: '#4a5568' }}>
                {editingId ? 'Edit Entry' : 'Log Recovery Entry'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-6 h-6" style={{ color: '#718096' }} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
              </div>

              {/* Entry Type */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#4a5568' }}>
                  Entry Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {entryTypes.map(type => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className="flex items-center gap-3 p-4 rounded-xl transition transform hover:scale-105"
                        style={{
                          background: formData.type === type.value ? type.bg : '#f0ebe4',
                          color: formData.type === type.value ? type.color : '#a0947d',
                          border: formData.type === type.value ? `2px solid ${type.color}` : '2px solid #d4cfc4',
                          boxShadow: formData.type === type.value ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <TypeIcon className="w-6 h-6" />
                        <span className="font-semibold">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Fields based on Entry Type */}
              {formData.type === 'urge_resisted' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label style={{ color: '#4a5568' }} className="font-medium text-sm">
                          Urge Intensity
                        </label>
                        <span style={{ color: '#c87355' }} className="font-bold text-lg">
                          {formData.urgeIntensity}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.urgeIntensity}
                        onChange={(e) => setFormData({ ...formData, urgeIntensity: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label style={{ color: '#4a5568' }} className="font-medium text-sm">
                          Resistance Strength
                        </label>
                        <span style={{ color: '#6b8e7f' }} className="font-bold text-lg">
                          {formData.resistanceStrength}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.resistanceStrength}
                        onChange={(e) => setFormData({ ...formData, resistanceStrength: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                      Money Not Spent (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.moneyNotSpent}
                      onChange={(e) => setFormData({ ...formData, moneyNotSpent: parseInt(e.target.value) || 0 })}
                      placeholder="How much did you save by not gambling?"
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500"
                      style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                    />
                  </div>
                </>
              )}

              {formData.type === 'relapse' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                      Amount Lost (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.amountLost}
                      onChange={(e) => setFormData({ ...formData, amountLost: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500"
                      style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                      Amount Won (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.amountWon}
                      onChange={(e) => setFormData({ ...formData, amountWon: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500"
                      style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500"
                      style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                    />
                  </div>
                </div>
              )}

              {/* Triggers */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#4a5568' }}>
                  What Triggered This?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {triggerOptions.map(trigger => (
                    <button
                      key={trigger}
                      onClick={() => toggleTrigger(trigger)}
                      className="px-3 py-2 rounded-lg text-sm transition"
                      style={{
                        background: formData.triggers.includes(trigger) ? '#fce8e8' : '#f0ebe4',
                        color: formData.triggers.includes(trigger) ? '#c87355' : '#a0947d',
                        border: formData.triggers.includes(trigger) ? '2px solid #c87355' : '2px solid #d4cfc4',
                        fontWeight: formData.triggers.includes(trigger) ? '600' : '400'
                      }}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coping Strategies */}
              {formData.type !== 'relapse' && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#4a5568' }}>
                    How Did You Cope?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {copingStrategyOptions.map(strategy => (
                      <button
                        key={strategy}
                        onClick={() => toggleCopingStrategy(strategy)}
                        className="px-3 py-2 rounded-lg text-sm transition"
                        style={{
                          background: formData.copingStrategies.includes(strategy) ? '#e8f0ed' : '#f0ebe4',
                          color: formData.copingStrategies.includes(strategy) ? '#6b8e7f' : '#a0947d',
                          border: formData.copingStrategies.includes(strategy) ? '2px solid #6b8e7f' : '2px solid #d4cfc4',
                          fontWeight: formData.copingStrategies.includes(strategy) ? '600' : '400'
                        }}
                      >
                        {strategy}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#4a5568' }}>
                  How Were You Feeling?
                </label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500 capitalize"
                  style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
                >
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood} className="capitalize">
                      {mood}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What happened? How did you feel? What helped? What would you do differently?"
                  rows="4"
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-teal-500 resize-none"
                  style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
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
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Entries Timeline */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card className="text-center py-16">
              <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: '#d4cfc4' }} />
              <p className="text-xl font-medium mb-2" style={{ color: '#4a5568' }}>
                No entries found
              </p>
              <p style={{ color: '#718096', fontSize: '16px' }}>
                {searchTerm ? 'Try adjusting your search or filters' : 'Start tracking your recovery journey!'}
              </p>
            </Card>
          ) : (
            filteredEntries.map(entry => {
              const typeConfig = getEntryTypeConfig(entry.type);
              const TypeIcon = typeConfig.icon;
              const isExpanded = expandedEntry === entry.id;

              return (
                <Card
                  key={entry.id}
                  className="overflow-hidden transition-all hover:shadow-lg"
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: `4px solid ${typeConfig.color}`
                  }}
                >
                  <div 
                    className="p-6"
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div 
                            className="p-3 rounded-xl"
                            style={{ background: typeConfig.bg }}
                          >
                            <TypeIcon className="w-8 h-8" style={{ color: typeConfig.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-2xl font-semibold" style={{ color: '#4a5568' }}>
                                {typeConfig.label}
                              </h3>
                              <span
                                className="px-3 py-1 rounded-full text-sm font-semibold"
                                style={{
                                  background: typeConfig.bg,
                                  color: typeConfig.color,
                                  border: `2px solid ${typeConfig.color}`
                                }}
                              >
                                {entry.mood}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: '#718096' }}>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(entry.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {entry.time}
                              </div>
                              {entry.daysClean !== undefined && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: '#e8f0ed', color: '#6b8e7f' }}>
                                  <Award className="w-4 h-4" />
                                  {entry.daysClean} days clean
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-6 text-sm flex-wrap">
                          {entry.urgeIntensity && (
                            <div style={{ color: '#c87355' }}>
                              <span className="font-medium">Urge:</span> <span className="font-bold">{entry.urgeIntensity}/10</span>
                            </div>
                          )}
                          {entry.resistanceStrength && (
                            <div style={{ color: '#6b8e7f' }}>
                              <span className="font-medium">Resistance:</span> <span className="font-bold">{entry.resistanceStrength}/10</span>
                            </div>
                          )}
                          {entry.moneyNotSpent > 0 && (
                            <div style={{ color: '#6b8e7f' }}>
                              <span className="font-medium">Saved:</span> <span className="font-bold">₦{entry.moneyNotSpent.toLocaleString()}</span>
                            </div>
                          )}
                          {entry.amountLost > 0 && (
                            <div style={{ color: '#c87355' }}>
                              <span className="font-medium">Lost:</span> <span className="font-bold">₦{entry.amountLost.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-5 h-5" style={{ color: '#718096' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" style={{ color: '#c87355' }} />
                        </button>
                        <button
                          className="p-2 transition"
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
                      className="px-6 pb-6 pt-4 space-y-4"
                      style={{ borderTop: '2px solid #e8e5df' }}
                    >
                      {/* Triggers */}
                      {entry.triggers && entry.triggers.length > 0 && (
                        <div>
                          <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            TRIGGERS
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {entry.triggers.map((trigger, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-sm font-medium"
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

                      {/* Coping Strategies */}
                      {entry.copingStrategies && entry.copingStrategies.length > 0 && (
                        <div>
                          <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            COPING STRATEGIES
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {entry.copingStrategies.map((strategy, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                  background: '#e8f0ed',
                                  color: '#6b8e7f',
                                  border: '1px solid #6b8e7f40'
                                }}
                              >
                                {strategy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {entry.notes && (
                        <div 
                          className="p-4 rounded-xl" 
                          style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                        >
                          <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                            NOTES
                          </p>
                          <p style={{ color: '#4a5568', lineHeight: '1.7', fontSize: '15px' }}>
                            {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GamblingAddictionTracker;

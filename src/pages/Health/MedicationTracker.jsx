import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Pill,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Bell,
  TrendingUp,
  Activity,
  X,
  Edit2,
  Trash2,
  Search,
  Download,
  ChevronDown,
  AlertTriangle,
  Heart,
  Brain,
  Zap,
  Shield,
  FileText,
  DollarSign
} from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import './MedicationTracker.css';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const MedicationTracker = () => {
  // ==================== INITIAL DATA ====================
  const initialMedications = [
    {
      id: 1,
      name: 'Sertraline',
      dosage: '100mg',
      form: 'tablet',
      frequency: 'daily',
      times: ['09:00'],
      purpose: 'Depression & Anxiety',
      prescribedBy: 'Dr. Adeyemi',
      startDate: '2024-11-15',
      endDate: null,
      active: true,
      withFood: true,
      sideEffects: ['Nausea', 'Headache'],
      notes: 'Take with breakfast. May cause drowsiness initially.',
      color: '#6b8e7f'
    },
    {
      id: 2,
      name: 'Lamotrigine',
      dosage: '200mg',
      form: 'tablet',
      frequency: 'twice_daily',
      times: ['09:00', '21:00'],
      purpose: 'Bipolar Disorder',
      prescribedBy: 'Dr. Okonkwo',
      startDate: '2024-10-01',
      endDate: null,
      active: true,
      withFood: false,
      sideEffects: [],
      notes: 'Mood stabilizer. Do not stop abruptly.',
      color: '#d4a574'
    },
    {
      id: 3,
      name: 'Melatonin',
      dosage: '5mg',
      form: 'tablet',
      frequency: 'as_needed',
      times: ['22:00'],
      purpose: 'Insomnia',
      prescribedBy: 'Over-the-counter',
      startDate: '2025-01-01',
      endDate: null,
      active: true,
      withFood: false,
      sideEffects: [],
      notes: 'Take 30 minutes before bed only when needed.',
      color: '#b8916d'
    }
  ];

  const initialDoseHistory = [
    {
      id: 1,
      medicationId: 1,
      medicationName: 'Sertraline',
      scheduledTime: '09:00',
      takenTime: '09:15',
      date: '2025-01-30',
      status: 'taken',
      notes: ''
    },
    {
      id: 2,
      medicationId: 2,
      medicationName: 'Lamotrigine',
      scheduledTime: '09:00',
      takenTime: '09:15',
      date: '2025-01-30',
      status: 'taken',
      notes: ''
    },
    {
      id: 3,
      medicationId: 2,
      medicationName: 'Lamotrigine',
      scheduledTime: '21:00',
      takenTime: null,
      date: '2025-01-30',
      status: 'missed',
      notes: 'Forgot evening dose'
    },
    {
      id: 4,
      medicationId: 1,
      medicationName: 'Sertraline',
      scheduledTime: '09:00',
      takenTime: '09:05',
      date: '2025-01-29',
      status: 'taken',
      notes: ''
    }
  ];

  // ==================== STATE MANAGEMENT ====================
  const [medications, setMedications] = useState(() => {
    try {
      const saved = localStorage.getItem('neuropulse_medications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    }
    return initialMedications;
  });

  const [doseHistory, setDoseHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('neuropulse_dose_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.error('Error loading dose history:', error);
    }
    return initialDoseHistory;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMed, setExpandedMed] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [selectedMedForDose, setSelectedMedForDose] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    form: 'tablet',
    frequency: 'daily',
    times: ['09:00'],
    purpose: '',
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    active: true,
    withFood: false,
    sideEffects: [],
    notes: '',
    color: '#6b8e7f'
  });

  const fileInputRef = useRef(null);
  const nextMedIdRef = useRef(Math.max(...initialMedications.map(m => m.id), 0) + 1);
  const nextDoseIdRef = useRef(Math.max(...initialDoseHistory.map(d => d.id), 0) + 1);

  // ==================== CONFIGURATION ====================
  const medicationForms = [
    'tablet', 'capsule', 'liquid', 'injection', 'inhaler', 
    'patch', 'cream', 'drops', 'spray', 'suppository'
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Once Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'three_times_daily', label: 'Three Times Daily' },
    { value: 'four_times_daily', label: 'Four Times Daily' },
    { value: 'every_other_day', label: 'Every Other Day' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'as_needed', label: 'As Needed' }
  ];

  const commonSideEffects = [
    'Nausea', 'Headache', 'Dizziness', 'Drowsiness', 'Insomnia',
    'Dry mouth', 'Constipation', 'Diarrhea', 'Weight gain', 'Weight loss',
    'Fatigue', 'Anxiety', 'Tremor', 'Sweating', 'Sexual dysfunction'
  ];

  const colorOptions = [
    '#6b8e7f', '#d4a574', '#c87355', '#b8916d', '#7a9a89',
    '#5a7d70', '#a0947d', '#8a8480', '#4a7365', '#3a6355'
  ];

  // ==================== HELPER FUNCTIONS ====================
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      dosage: '',
      form: 'tablet',
      frequency: 'daily',
      times: ['09:00'],
      purpose: '',
      prescribedBy: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      active: true,
      withFood: false,
      sideEffects: [],
      notes: '',
      color: '#6b8e7f'
    });
  }, []);

  const getFrequencyLabel = (frequency) => {
    const option = frequencyOptions.find(f => f.value === frequency);
    return option ? option.label : frequency;
  };

  const getDefaultTimesForFrequency = (frequency) => {
    switch (frequency) {
      case 'daily':
        return ['09:00'];
      case 'twice_daily':
        return ['09:00', '21:00'];
      case 'three_times_daily':
        return ['09:00', '14:00', '21:00'];
      case 'four_times_daily':
        return ['09:00', '13:00', '17:00', '21:00'];
      case 'weekly':
        return ['09:00'];
      case 'as_needed':
        return ['09:00'];
      default:
        return ['09:00'];
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    try {
      localStorage.setItem('neuropulse_medications', JSON.stringify(medications));
    } catch (error) {
      console.error('Error saving medications:', error);
    }
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem('neuropulse_dose_history', JSON.stringify(doseHistory));
    } catch (error) {
      console.error('Error saving dose history:', error);
    }
  }, [doseHistory]);

  // ==================== COMPUTED VALUES ====================
  const filteredMedications = useMemo(() => {
    let filtered = [...medications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(term) ||
        med.purpose.toLowerCase().includes(term) ||
        med.prescribedBy.toLowerCase().includes(term)
      );
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(med => med.active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(med => !med.active);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [medications, searchTerm, filterStatus]);

  const todaysDoses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeMeds = medications.filter(m => m.active);
    
    const scheduledDoses = activeMeds.flatMap(med => 
      med.times.map(time => ({
        medicationId: med.id,
        medicationName: med.name,
        scheduledTime: time,
        date: today,
        color: med.color
      }))
    );

    return scheduledDoses.map(scheduled => {
      const taken = doseHistory.find(
        dose =>
          dose.medicationId === scheduled.medicationId &&
          dose.date === scheduled.date &&
          dose.scheduledTime === scheduled.scheduledTime
      );

      return {
        ...scheduled,
        status: taken ? taken.status : 'pending',
        takenTime: taken?.takenTime,
        notes: taken?.notes || '',
        doseId: taken?.id
      };
    }).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medications, doseHistory]);

  const stats = useMemo(() => {
    const activeMeds = medications.filter(m => m.active).length;
    const totalMeds = medications.length;
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const adherenceData = last7Days.map(date => {
      const scheduledForDay = medications
        .filter(m => m.active)
        .reduce((sum, med) => sum + med.times.length, 0);
      
      const takenForDay = doseHistory.filter(
        dose => dose.date === date && dose.status === 'taken'
      ).length;

      return {
        scheduled: scheduledForDay,
        taken: takenForDay
      };
    });

    const totalScheduled = adherenceData.reduce((sum, d) => sum + d.scheduled, 0);
    const totalTaken = adherenceData.reduce((sum, d) => sum + d.taken, 0);
    const adherenceRate = totalScheduled > 0 ? ((totalTaken / totalScheduled) * 100).toFixed(1) : 0;

    const todayTaken = todaysDoses.filter(d => d.status === 'taken').length;
    const todayTotal = todaysDoses.length;
    const todayAdherence = todayTotal > 0 ? ((todayTaken / todayTotal) * 100).toFixed(1) : 0;

    return {
      activeMeds,
      totalMeds,
      adherenceRate,
      todayTaken,
      todayTotal,
      todayAdherence
    };
  }, [medications, doseHistory, todaysDoses]);

  const adherenceChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const scheduledForDay = medications
        .filter(m => m.active)
        .reduce((sum, med) => sum + med.times.length, 0);
      
      const takenForDay = doseHistory.filter(
        dose => dose.date === dateStr && dose.status === 'taken'
      ).length;

      const missedForDay = doseHistory.filter(
        dose => dose.date === dateStr && dose.status === 'missed'
      ).length;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        taken: takenForDay,
        missed: missedForDay,
        pending: Math.max(0, scheduledForDay - takenForDay - missedForDay)
      };
    });
  }, [medications, doseHistory]);

  // ==================== EVENT HANDLERS ====================
  const handleAddMedication = useCallback(() => {
    if (editingId) {
      setMedications(prev =>
        prev.map(med =>
          med.id === editingId ? { ...med, ...formData } : med
        )
      );
      setEditingId(null);
    } else {
      const newMed = {
        ...formData,
        id: nextMedIdRef.current++
      };
      setMedications(prev => [newMed, ...prev]);
    }
    resetForm();
    setShowAddForm(false);
  }, [editingId, formData, resetForm]);

  const handleEditMedication = useCallback((med) => {
    setFormData(med);
    setEditingId(med.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteMedication = useCallback((id) => {
    if (window.confirm('Delete this medication? This will also delete its dose history.')) {
      setMedications(prev => prev.filter(med => med.id !== id));
      setDoseHistory(prev => prev.filter(dose => dose.medicationId !== id));
      if (expandedMed === id) {
        setExpandedMed(null);
      }
    }
  }, [expandedMed]);

  const handleToggleMedication = useCallback((id) => {
    setMedications(prev =>
      prev.map(med =>
        med.id === id ? { ...med, active: !med.active } : med
      )
    );
  }, []);

  const handleLogDose = useCallback((dose, status, notes = '') => {
    const newDose = {
      id: nextDoseIdRef.current++,
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      scheduledTime: dose.scheduledTime,
      takenTime: status === 'taken' ? new Date().toTimeString().slice(0, 5) : null,
      date: dose.date,
      status,
      notes
    };

    // Remove existing dose if updating
    if (dose.doseId) {
      setDoseHistory(prev => prev.filter(d => d.id !== dose.doseId));
    }

    setDoseHistory(prev => [newDose, ...prev]);
    setShowDoseModal(false);
    setSelectedMedForDose(null);
  }, []);

  const toggleSideEffect = useCallback((effect) => {
    setFormData(prev => ({
      ...prev,
      sideEffects: prev.sideEffects.includes(effect)
        ? prev.sideEffects.filter(e => e !== effect)
        : [...prev.sideEffects, effect]
    }));
  }, []);

  const updateTimes = useCallback((index, value) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.map((time, i) => (i === index ? value : time))
    }));
  }, []);

  const addTimeSlot = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, '09:00']
    }));
  }, []);

  const removeTimeSlot = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  }, []);

  const downloadReport = useCallback(() => {
    const reportText = `
NEUROPULSE MEDICATION TRACKER REPORT
${'='.repeat(70)}
Report Date: ${new Date().toLocaleDateString()}
Total Medications: ${stats.totalMeds}
Active Medications: ${stats.activeMeds}
7-Day Adherence Rate: ${stats.adherenceRate}%

CURRENT MEDICATIONS
${'-'.repeat(70)}
${filteredMedications
  .filter(m => m.active)
  .map(med => `
Medication: ${med.name} ${med.dosage}
Form: ${med.form}
Frequency: ${getFrequencyLabel(med.frequency)}
Times: ${med.times.join(', ')}
Purpose: ${med.purpose}
Prescribed By: ${med.prescribedBy}
Start Date: ${new Date(med.startDate).toLocaleDateString()}
With Food: ${med.withFood ? 'Yes' : 'No'}
Side Effects: ${med.sideEffects.join(', ') || 'None reported'}
Notes: ${med.notes || 'None'}
`)
  .join('\n' + '-'.repeat(70) + '\n')}

RECENT DOSE HISTORY (Last 7 Days)
${'-'.repeat(70)}
${doseHistory
  .filter(dose => {
    const doseDate = new Date(dose.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return doseDate >= weekAgo;
  })
  .sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.scheduledTime.localeCompare(a.scheduledTime);
  })
  .map(dose => `
Date: ${new Date(dose.date).toLocaleDateString()}
Medication: ${dose.medicationName}
Scheduled: ${dose.scheduledTime}
Status: ${dose.status.toUpperCase()}
${dose.takenTime ? `Taken At: ${dose.takenTime}` : ''}
${dose.notes ? `Notes: ${dose.notes}` : ''}
`)
  .join('\n' + '-'.repeat(70) + '\n')}

ADHERENCE SUMMARY
${'-'.repeat(70)}
Today: ${stats.todayTaken}/${stats.todayTotal} doses taken (${stats.todayAdherence}%)
Last 7 Days: ${stats.adherenceRate}% adherence rate

Stay consistent with your medication routine! 💊
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medication-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredMedications, doseHistory, stats]);

  const exportJSON = useCallback(() => {
    try {
      const data = JSON.stringify({
        medications,
        doseHistory,
        exportDate: new Date().toISOString()
      }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medication-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Failed to export data. Please try again.');
    }
  }, [medications, doseHistory]);

  // ==================== RENDER ====================
  return (
    <div className="app-root">
      <div className="main-viewport-container">
        {/* Header */}
        <div className="page-header-container">
          <h1 className="page-title">
            Medication Tracker
          </h1>
          <p style={{ color: '#718096', fontSize: '16px' }}>
            Track your medications, log doses, and monitor adherence
          </p>
        </div>

        {/* Stats Overview */}
        <div className="responsive-grid">
          {/* Active Medications */}
          <Card className="your-class-name">
            <div className="f-wed">
              <div>
                <p className="label-text">
                  Active Medications
                </p>
                <p className="heading-large" style={{ color: '#6b8e7f' }}>
                  {stats.activeMeds}
                </p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  out of {stats.totalMeds} total
                </p>
              </div>
              <Pill className="w-10 h-10" style={{ color: '#6b8e7f', opacity: 0.6 }} />
            </div>
          </Card>

          {/* Today's Progress */}
          <Card className="your-class-name">
            <div className="flex justify-between items-start">
              <div>
                <p className="label-text">
                  Today's Progress
                </p>
                <p className="heading-large" style={{ color: '#d4a574' }}>
                  {stats.todayTaken}/{stats.todayTotal}
                </p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  {stats.todayAdherence}% completed
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10" style={{ color: '#d4a574', opacity: 0.6 }} />
            </div>
          </Card>

          {/* 7-Day Adherence */}
          <Card className="your-class-name" style={{ 
            background: stats.adherenceRate >= 80 
              ? 'linear-gradient(135deg, #e8f0ed 0%, #d0e8db 100%)'
              : stats.adherenceRate >= 60
                ? 'linear-gradient(135deg, #fff9f0 0%, #fef5e8 100%)'
                : 'linear-gradient(135deg, #fce8e8 0%, #fef5e8 100%)'
          }}>
            <div className="flex-header">
              <div>
                <p className="label-text">
                  7-Day Adherence
                </p>
                <p className="heading-large" style={{ 
                  color: stats.adherenceRate >= 80 ? '#6b8e7f' : 
                         stats.adherenceRate >= 60 ? '#d4a574' : '#c87355'
                }}>
                  {stats.adherenceRate}%
                </p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  {stats.adherenceRate >= 80 ? 'Excellent!' : 
                   stats.adherenceRate >= 60 ? 'Good' : 'Needs improvement'}
                </p>
              </div>
              <TrendingUp className="w-10 h-10" style={{ 
                color: stats.adherenceRate >= 80 ? '#6b8e7f' : 
                       stats.adherenceRate >= 60 ? '#d4a574' : '#c87355',
                opacity: 0.6
              }} />
            </div>
          </Card>

          {/* Upcoming Dose */}
          <Card className="your-class-name">
            <div className="f-wed">
              <div>
                <p className="label-text">
                  Next Dose
                </p>
                {todaysDoses.filter(d => d.status === 'pending')[0] ? (
                  <>
                    <p className="heading-large" style={{ color: '#4a5568' }}>
                      {todaysDoses.filter(d => d.status === 'pending')[0].scheduledTime}
                    </p>
                    <p className="text-xs" style={{ color: '#718096' }}>
                      {todaysDoses.filter(d => d.status === 'pending')[0].medicationName}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="heading-large" style={{ color: '#6b8e7f' }}>
                      All done!
                    </p>
                    <p className="text-xs" style={{ color: '#718096' }}>
                      No pending doses
                    </p>
                  </>
                )}
              </div>
              <Bell className="w-10 h-10" style={{ color: '#b8916d', opacity: 0.6 }} />
            </div>
          </Card>
        </div>

        {/* Today's Doses */}
        {todaysDoses.length > 0 && (
          <Card className="card-container">
            <h2 className="section-title" style={{ color: '#4a5568' }}>
              Today's Medication Schedule
            </h2>
            <div className="stack-vertical">
              {todaysDoses.map((dose, idx) => (
                <div
                  key={idx}
                  className="list-item-container"
                  style={{
                    background: dose.status === 'taken' ? '#e8f0ed' : 
                                dose.status === 'missed' ? '#fce8e8' : '#fafaf8',
                    border: `2px solid ${
                      dose.status === 'taken' ? '#6b8e7f' : 
                      dose.status === 'missed' ? '#c87355' : '#d4cfc4'
                    }`
                  }}
                >
                  <div className="just-item-grow">
                    <div
                      className="dot-indicator"
                      style={{ background: dose.color }}
                    />
                    <Clock className="w-5 h-5" style={{ color: '#718096' }} />
                    <div>
                      <p className="font-semibold" style={{ color: '#4a5568' }}>
                        {dose.medicationName}
                      </p>
                      <p className="text-sm" style={{ color: '#718096' }}>
                        Scheduled: {dose.scheduledTime}
                        {dose.takenTime && ` • Taken: ${dose.takenTime}`}
                      </p>
                    </div>
                  </div>

                  <div className="butt-group">
                    {dose.status === 'pending' ? (
                      <>
                        <Button
                          onClick={() => handleLogDose(dose, 'taken')}
                          variant="primary"
                          className="button-secondary"
                        >
                          <CheckCircle2 className="icon-spacing" />
                          Taken
                        </Button>
                        <Button
                          onClick={() => handleLogDose(dose, 'missed', 'Forgot to take')}
                          variant="secondary"
                          className="button-secondary"
                        >
                          <XCircle className="icon-spacing" />
                          Missed
                        </Button>
                      </>
                    ) : (
                      <div className="custom-button" style={{
                        background: dose.status === 'taken' ? '#6b8e7f20' : '#c8735520',
                        color: dose.status === 'taken' ? '#6b8e7f' : '#c87355'
                      }}>
                        {dose.status === 'taken' ? (
                          <CheckCircle2 className="icon-spacing" />
                        ) : (
                          <XCircle className="icon-spacing" />
                        )}
                        <span className="font-semibold capitalize">{dose.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Adherence Chart */}
        {adherenceChartData.length > 0 && (
          <Card className="card-container">
            <h2 className="section-heading4" style={{ color: '#4a5568' }}>
              7-Day Adherence Tracking
            </h2>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adherenceChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e5df" />
                  <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 12 }} stroke="#d4cfc4" />
                  <YAxis tick={{ fill: '#718096', fontSize: 12 }} stroke="#d4cfc4" />
                  <Tooltip contentStyle={{ background: '#fafaf8', border: '1px solid #d4cfc4', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="taken" fill="#6b8e7f" name="Taken" stackId="a" />
                  <Bar dataKey="missed" fill="#c87355" name="Missed" stackId="a" />
                  <Bar dataKey="pending" fill="#d4cfc4" name="Pending" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Filters & Actions */}
        <div className="b-container">
          <div className="flexible-anchor">
            <Search className="absolute-icon" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
            />
          </div>

          <div className="flex-tag-container">
            {['all', 'active', 'inactive'].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'primary' : 'secondary'}
                onClick={() => setFilterStatus(status)}
                className="badge-or-button"
              >
                {status}
              </Button>
            ))}
          </div>

          <div className="c-container">
            <Button onClick={downloadReport} variant="secondary" className="button-spacing">
              <Download className="icon-with-margin" />
              Report
            </Button>
            <Button onClick={exportJSON} variant="secondary" className="button-spacing">
              <Download className="icon-with-margin" />
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
              className="button-spacing"
            >
              <Plus className="icon-with-margin" />
              Add Medication
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="card-style" style={{ background: 'linear-gradient(to br, #fafaf8, #f5f3ef)' }}>
            <div className="flex-header">
              <h2 className="heading-large" style={{ color: '#4a5568' }}>
                {editingId ? 'Edit Medication' : 'Add New Medication'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="interactive-item"
              >
                <X className="icon-base" style={{ color: '#718096' }} />
              </button>
            </div>

            <div className="container">
              {/* Name & Dosage */}
              <div className="responsive-grid">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sertraline"
                    className="input-field"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 100mg"
                    className="input-custom"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
              </div>

              {/* Form & Frequency */}
              <div className="responsive-grid">
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    Form
                  </label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    className="input-field"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
                  >
                    {medicationForms.map(form => (
                      <option key={form} value={form} className="capitalize">
                        {form}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => {
                      const newFrequency = e.target.value;
                      setFormData({ 
                        ...formData, 
                        frequency: newFrequency,
                        times: getDefaultTimesForFrequency(newFrequency)
                      });
                    }}
                    className="input-custom"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
                  >
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Times */}
              <div>
                <div className="flex-header">
                  <label className="label-text" style={{ color: '#4a5568' }}>
                    Times to Take
                  </label>
                  <Button onClick={addTimeSlot} variant="secondary" className="px-3 py-1 text-sm">
                    <Plus className="inline-icon" />
                    Add Time
                  </Button>
                </div>
                <div className="responsive-gallery">
                  {formData.times.map((time, idx) => (
                    <div key={idx} className="flex-cont">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTimes(idx, e.target.value)}
                        className="flex-input"
                        style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                      />
                      {formData.times.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(idx)}
                          className="action-item-danger"
                        >
                          <X className="icon-small" style={{ color: '#c87355' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Purpose & Prescribed By */}
              <div className="responsive-grid">
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g., Depression & Anxiety"
                    className="input-field"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    Prescribed By
                  </label>
                  <input
                    type="text"
                    value={formData.prescribedBy}
                    onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
                    placeholder="e.g., Dr. Adeyemi"
                    className="input-field"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
              </div>

              {/* Start & End Date */}
              <div className="responsive-grid">
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    <Calendar className="icon-small inline mr-2" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ color: '#4a5568' }}>
                    <Calendar className="icon-small inline mr-2" />
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                    className="input-field"
                    style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex-container-wide">
                <label className="interactive-flex">
                  <input
                    type="checkbox"
                    checked={formData.withFood}
                    onChange={(e) => setFormData({ ...formData, withFood: e.target.checked })}
                    className="box-small"
                    style={{ accentColor: '#6b8e7f' }}
                  />
                  <span style={{ color: '#4a5568' }}>Take with food</span>
                </label>
                <label className="interactive-flex">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="box-small"
                    style={{ accentColor: '#6b8e7f' }}
                  />
                  <span style={{ color: '#4a5568' }}>Currently taking</span>
                </label>
              </div>

              {/* Side Effects */}
              <div>
                <label className="form-label" style={{ color: '#4a5568' }}>
                  Side Effects (if any)
                </label>
                <div className="responsive-grid">
                  {commonSideEffects.map(effect => (
                    <button
                      key={effect}
                      onClick={() => toggleSideEffect(effect)}
                      className="btn-utility"
                      style={{
                        background: formData.sideEffects.includes(effect) ? '#fce8e8' : '#f0ebe4',
                        color: formData.sideEffects.includes(effect) ? '#c87355' : '#a0947d',
                        border: formData.sideEffects.includes(effect) ? '2px solid #c87355' : '2px solid #d4cfc4',
                        fontWeight: formData.sideEffects.includes(effect) ? '600' : '400'
                      }}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="form-label" style={{ color: '#4a5568' }}>
                  Color Tag
                </label>
                <div className="flex-row-space">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className="interactive-avatar"
                      style={{
                        background: color,
                        border: formData.color === color ? '3px solid #4a5568' : '2px solid #d4cfc4',
                        boxShadow: formData.color === color ? '0 4px 6px rgba(0,0,0,0.2)' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label" style={{ color: '#4a5568' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional instructions, reminders, or observations..."
                  rows="3"
                  className="textarea-custom"
                  style={{ background: '#fafaf8', border: '2px solid #d4cfc4', color: '#4a5568' }}
                />
              </div>
            </div>

            <div className="action-row">
              <Button onClick={handleAddMedication} variant="primary" className="flex-1 md:flex-none">
                {editingId ? 'Update Medication' : 'Save Medication'}
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

        {/* Medications List */}
        <div className="space-y-4">
          {filteredMedications.length === 0 ? (
            <Card className="carded-container">
              <Pill className="centered-icon" style={{ color: '#d4cfc4' }} />
              <p className="card-heading" style={{ color: '#4a5568' }}>
                No medications found
              </p>
              <p style={{ color: '#718096', fontSize: '16px' }}>
                {searchTerm ? 'Try adjusting your search or filters' : 'Start tracking your medications!'}
              </p>
            </Card>
          ) : (
            filteredMedications.map(med => {
              const isExpanded = expandedMed === med.id;

              return (
                <Card
                  key={med.id}
                  className="interactive-card"
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: `6px solid ${med.color}`,
                    opacity: med.active ? 1 : 0.6
                  }}
                >
                  <div 
                    className="padding-standard"
                    onClick={() => setExpandedMed(isExpanded ? null : med.id)}
                  >
                    <div className="header-layout">
                      <div className="expandable-item">
                        <div className="media-header">
                          <div 
                            className="status-dot"
                            style={{ background: med.color }}
                          />
                          <div className="expandable-item">
                            <div className="badge-container">
                              <h3 className="section-title" style={{ color: '#4a5568' }}>
                                {med.name} {med.dosage}
                              </h3>
                              <span
                                className="badge-ch"
                                style={{
                                  background: med.active ? '#e8f0ed' : '#e8e3dc',
                                  color: med.active ? '#6b8e7f' : '#8a8480',
                                  border: `2px solid ${med.active ? '#6b8e7f' : '#8a8480'}`
                                }}
                              >
                                {med.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: '#718096' }}>
                              <div className="flex items-center gap-1">
                                <Pill className="w-4 h-4" />
                                {getFrequencyLabel(med.frequency)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {med.times.join(', ')}
                              </div>
                              {med.purpose && (
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {med.purpose}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMedication(med.id);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                          title={med.active ? 'Mark as inactive' : 'Mark as active'}
                        >
                          {med.active ? (
                            <Shield className="w-5 h-5" style={{ color: '#6b8e7f' }} />
                          ) : (
                            <AlertCircle className="w-5 h-5" style={{ color: '#718096' }} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMedication(med);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-5 h-5" style={{ color: '#718096' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedication(med.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" style={{ color: '#c87355' }} />
                        </button>
                        <button
                          className="p-2 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMed(isExpanded ? null : med.id);
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Details */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                              FORM
                            </p>
                            <p className="capitalize" style={{ color: '#4a5568' }}>{med.form}</p>
                          </div>

                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                              PRESCRIBED BY
                            </p>
                            <p style={{ color: '#4a5568' }}>{med.prescribedBy}</p>
                          </div>

                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                              START DATE
                            </p>
                            <p style={{ color: '#4a5568' }}>
                              {new Date(med.startDate).toLocaleDateString()}
                              {med.endDate && ` - ${new Date(med.endDate).toLocaleDateString()}`}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                              INSTRUCTIONS
                            </p>
                            <p style={{ color: '#4a5568' }}>
                              {med.withFood ? 'Take with food' : 'Can be taken without food'}
                            </p>
                          </div>
                        </div>

                        {/* Side Effects & Notes */}
                        <div className="space-y-3">
                          {med.sideEffects.length > 0 && (
                            <div>
                              <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                                SIDE EFFECTS
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {med.sideEffects.map((effect, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                      background: '#fce8e8',
                                      color: '#c87355',
                                      border: '1px solid #c8735540'
                                    }}
                                  >
                                    {effect}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {med.notes && (
                            <div>
                              <p className="text-xs font-bold mb-2" style={{ color: '#9ca3af', letterSpacing: '0.05em' }}>
                                NOTES
                              </p>
                              <p style={{ color: '#4a5568', lineHeight: '1.6' }}>{med.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
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

export default MedicationTracker;

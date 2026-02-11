import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Heart,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  Filter,
  ChevronDown,
  Brain,
  Droplet,
  Activity,
  Pill,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  MapPin,
  Phone
} from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const HealthHistory = () => {
  const [healthRecords, setHealthRecords] = useState([
    {
      id: 1,
      date: '2025-01-28',
      type: 'psychiatric-visit',
      title: 'Monthly Psychiatric Checkup',
      provider: 'Dr. Sarah Johnson',
      specialty: 'Psychiatry',
      location: 'Mental Health Clinic, Suite 200',
      phone: '(555) 123-4567',
      notes: 'Patient showing improvement in anxiety symptoms. Continue current medication regimen. Schedule follow-up in 4 weeks.',
      diagnosis: 'Major Depressive Disorder, Generalized Anxiety Disorder',
      treatment: 'Continued Sertraline 100mg daily',
      vitals: {
        bloodPressure: '120/78',
        heartRate: 72,
        mood: 'Improved'
      },
      symptoms: ['Reduced anxiety', 'Better sleep', 'Improved focus'],
      recommendations: ['Continue medication', 'Weekly therapy', 'Daily exercise']
    },
    {
      id: 2,
      date: '2025-01-20',
      type: 'lab-work',
      title: 'Fasting Blood Glucose Test',
      provider: 'Quest Diagnostics',
      specialty: 'Laboratory',
      location: 'Downtown Lab Center',
      phone: '(555) 987-6543',
      notes: 'Routine diabetes monitoring',
      testName: 'Fasting Blood Glucose',
      result: '105 mg/dL',
      normalRange: '70-100 mg/dL',
      status: 'slightly-elevated',
      timestamp: '08:00 AM',
      recommendations: ['Increase physical activity', 'Monitor diet', 'Next test in 3 months']
    },
    {
      id: 3,
      date: '2025-01-15',
      type: 'medication-adjustment',
      title: 'Medication Review & Adjustment',
      provider: 'Dr. Michael Chen',
      specialty: 'General Medicine',
      location: 'Primary Care Office',
      phone: '(555) 456-7890',
      notes: 'Patient experiencing minor side effects from current diabetic medication. Adjusted Metformin dosage.',
      changes: [
        { medication: 'Metformin', from: '500mg twice daily', to: '500mg three times daily' }
      ],
      reason: 'Improved glucose control',
      followUp: '2025-02-15'
    },
    {
      id: 4,
      date: '2025-01-10',
      type: 'psychiatric-visit',
      title: 'Emergency Mental Health Session',
      provider: 'Dr. David Martinez',
      specialty: 'Crisis Psychiatry',
      location: 'Emergency Mental Health Center',
      phone: '(555) 999-8888',
      notes: 'Patient presented with acute anxiety episode. Provided crisis intervention and coping strategies.',
      trigger: 'Work-related stress',
      interventions: ['Deep breathing exercises', 'Grounding techniques', 'Safety planning'],
      outcome: 'Patient stabilized, discharged with follow-up care plan'
    },
    {
      id: 5,
      date: '2025-01-05',
      type: 'comprehensive-exam',
      title: 'Comprehensive Physical Examination',
      provider: 'Dr. Lisa Anderson',
      specialty: 'Internal Medicine',
      location: 'Medical Center, Building A',
      phone: '(555) 321-0987',
      notes: 'Annual comprehensive exam including mental and physical health assessment.',
      vitals: {
        bloodPressure: '118/76',
        heartRate: 70,
        temperature: '98.6°F',
        respiratoryRate: 16,
        weight: '170 lbs',
        height: '5\'10"',
        BMI: 24.4
      },
      findings: ['Overall health stable', 'Mental health improving', 'Diabetes well-controlled'],
      recommendations: ['Continue current medications', 'Maintain healthy lifestyle', 'Annual screening']
    },
    {
      id: 6,
      date: '2024-12-20',
      type: 'therapy-session',
      title: 'Psychotherapy Session',
      provider: 'Dr. Jennifer Lee',
      specialty: 'Clinical Psychology',
      location: 'Behavioral Health Center',
      phone: '(555) 654-3210',
      notes: 'Cognitive behavioral therapy session focusing on anxiety management and coping strategies.',
      sessionFocus: 'Anxiety management, stress reduction',
      techniques: ['CBT', 'Mindfulness', 'Relaxation techniques'],
      progress: 'Patient demonstrates improved understanding of thought patterns',
      nextSession: '2025-01-03'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    date: '',
    type: 'psychiatric-visit',
    title: '',
    provider: '',
    specialty: '',
    location: '',
    phone: '',
    notes: ''
  });

  const recordTypes = [
    { id: 'psychiatric-visit', label: 'Psychiatric Visit', color: '#6b8e7f', bg: '#e8f0ed', icon: Brain },
    { id: 'diabetic-visit', label: 'Diabetic Visit', color: '#d4a574', bg: '#fff9f0', icon: Droplet },
    { id: 'lab-work', label: 'Lab Work', color: '#8b7355', bg: '#f5e8e0', icon: FileText },
    { id: 'medication-adjustment', label: 'Medication Adjustment', color: '#7a5f4f', bg: '#efe7df', icon: Pill },
    { id: 'therapy-session', label: 'Therapy Session', color: '#6b8e7f', bg: '#e8f0ed', icon: Stethoscope },
    { id: 'comprehensive-exam', label: 'Comprehensive Exam', color: '#9a8a7a', bg: '#f0e8df', icon: Activity }
  ];

  const getTypeInfo = (typeId) => {
    return recordTypes.find(t => t.id === typeId);
  };

  const filteredRecords = healthRecords.filter(record => {
    const matchesType = selectedType === 'all' || record.type === selectedType;
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.notes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleAddRecord = () => {
    if (editingId) {
      setHealthRecords(healthRecords.map(record =>
        record.id === editingId ? { ...record, ...formData } : record
      ));
      setEditingId(null);
    } else {
      const newRecord = {
        ...formData,
        id: Date.now()
      };
      setHealthRecords([newRecord, ...healthRecords]);
    }
    setFormData({
      date: '',
      type: 'psychiatric-visit',
      title: '',
      provider: '',
      specialty: '',
      location: '',
      phone: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleDeleteRecord = (id) => {
    setHealthRecords(healthRecords.filter(record => record.id !== id));
  };

  const handleEditRecord = (record) => {
    setFormData({
      date: record.date,
      type: record.type,
      title: record.title,
      provider: record.provider,
      specialty: record.specialty,
      location: record.location,
      phone: record.phone,
      notes: record.notes
    });
    setEditingId(record.id);
    setShowAddForm(true);
  };

  const downloadRecord = (record) => {
    const recordText = `
HEALTH HISTORY RECORD
${'-'.repeat(50)}
Date: ${record.date}
Type: ${getTypeInfo(record.type)?.label}
Title: ${record.title}
Provider: ${record.provider}
Specialty: ${record.specialty}
Location: ${record.location}
Phone: ${record.phone}

NOTES:
${record.notes}

${record.diagnosis ? `DIAGNOSIS:\n${record.diagnosis}\n` : ''}
${record.treatment ? `TREATMENT:\n${record.treatment}\n` : ''}
${record.vitals ? `VITALS:\n${JSON.stringify(record.vitals, null, 2)}\n` : ''}
${record.recommendations ? `RECOMMENDATIONS:\n${record.recommendations.join('\n')}\n` : ''}
    `;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(recordText));
    element.setAttribute('download', `health-record-${record.date}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const stats = {
    total: healthRecords.length,
    psychiatric: healthRecords.filter(r => r.type === 'psychiatric-visit' || r.type === 'therapy-session').length,
    medical: healthRecords.filter(r => r.type !== 'psychiatric-visit' && r.type !== 'therapy-session').length,
    thisMonth: healthRecords.filter(r => {
      const recordDate = new Date(r.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
      fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
    }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold mb-3" style={{ color: '#4a5568' }}>
            Health History
          </h1>
          <p style={{ color: '#718096', fontSize: '16px' }}>
            Complete medical and mental health records for continuity of care
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-2xl shadow-sm" style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }} className="font-medium mb-2">
                  Total Records
                </p>
                <p className="text-3xl font-bold" style={{ color: '#4a5568' }}>
                  {stats.total}
                </p>
              </div>
              <FileText className="w-8 h-8" style={{ color: '#d4cfc4' }} />
            </div>
          </div>

          <div className="p-6 rounded-2xl shadow-sm" style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }} className="font-medium mb-2">
                  Mental Health
                </p>
                <p className="text-3xl font-bold" style={{ color: '#6b8e7f' }}>
                  {stats.psychiatric}
                </p>
              </div>
              <Brain className="w-8 h-8" style={{ color: '#6b8e7f', opacity: 0.6 }} />
            </div>
          </div>

          <div className="p-6 rounded-2xl shadow-sm" style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }} className="font-medium mb-2">
                  Medical Records
                </p>
                <p className="text-3xl font-bold" style={{ color: '#d4a574' }}>
                  {stats.medical}
                </p>
              </div>
              <Heart className="w-8 h-8" style={{ color: '#d4a574', opacity: 0.6 }} />
            </div>
          </div>

          <div className="p-6 rounded-2xl shadow-sm" style={{ background: '#fafaf8', border: '2px solid #d4cfc4' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }} className="font-medium mb-2">
                  This Month
                </p>
                <p className="text-3xl font-bold" style={{ color: '#6b8e7f' }}>
                  {stats.thisMonth}
                </p>
              </div>
              <Calendar className="w-8 h-8" style={{ color: '#6b8e7f', opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ background: '#fafaf8' }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === 'all' ? 'primary' : 'secondary'}
              onClick={() => setSelectedType('all')}
              className="px-4 py-2 text-sm"
            >
              <Filter className="w-4 h-4" />
              All
            </Button>
            {recordTypes.slice(0, 3).map(type => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? 'primary' : 'secondary'}
                onClick={() => setSelectedType(type.id)}
                className="px-4 py-2 text-sm"
              >
                {type.label}
              </Button>
            ))}
          </div>

          <Button onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setFormData({
              date: '',
              type: 'psychiatric-visit',
              title: '',
              provider: '',
              specialty: '',
              location: '',
              phone: '',
              notes: ''
            });
          }} variant="primary">
            <Plus className="w-5 h-5" />
            Add Record
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-8 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: '#4a5568' }}>
                {editingId ? 'Edit Health Record' : 'Add New Health Record'}
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Record Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                >
                  {recordTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monthly Psychiatric Checkup"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Provider *
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., Dr. Sarah Johnson"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Specialty
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g., Psychiatry"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Mental Health Clinic"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., (555) 123-4567"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Notes & Details
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter detailed notes about the visit, diagnosis, treatment plan, etc."
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ background: '#fafaf8' }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button onClick={handleAddRecord} variant="primary">
                {editingId ? 'Update Record' : 'Add Record'}
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Health Records Timeline */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#d4cfc4' }} />
              <p style={{ color: '#718096', fontSize: '16px' }}>
                No health records found. Add your first record to get started!
              </p>
            </Card>
          ) : (
            filteredRecords.map((record) => {
              const typeInfo = getTypeInfo(record.type);
              const Icon = typeInfo.icon;
              const isExpanded = expandedRecord === record.id;

              return (
                <Card
                  key={record.id}
                  onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                  className="cursor-pointer overflow-hidden"
                >
                  {/* Record Header */}
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-lg mt-1"
                      style={{ background: typeInfo.bg }}
                    >
                      <Icon className="w-6 h-6" style={{ color: typeInfo.color }} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold" style={{ color: '#4a5568' }}>
                              {record.title}
                            </h3>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                background: typeInfo.bg,
                                color: typeInfo.color,
                                border: `1px solid ${typeInfo.color}40`
                              }}
                            >
                              {typeInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm" style={{ color: '#718096' }}>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {record.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {record.provider}
                            </div>
                            {record.specialty && (
                              <div className="text-xs" style={{ color: '#9ca3af' }}>
                                {record.specialty}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadRecord(record);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Download className="w-5 h-5" style={{ color: '#718096' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRecord(record);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-5 h-5" style={{ color: '#718096' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecord(record.id);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" style={{ color: '#c87355' }} />
                          </button>
                          <button
                            className="p-2 transition"
                            onClick={(e) => e.stopPropagation()}
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
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div>
                          <h4 className="font-semibold mb-3" style={{ color: '#4a5568' }}>
                            Provider Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 mt-0.5" style={{ color: '#718096' }} />
                              <div>
                                <p style={{ color: '#9ca3af' }} className="text-xs">Provider</p>
                                <p style={{ color: '#4a5568' }}>{record.provider}</p>
                              </div>
                            </div>
                            {record.specialty && (
                              <div className="flex items-start gap-2">
                                <Stethoscope className="w-4 h-4 mt-0.5" style={{ color: '#718096' }} />
                                <div>
                                  <p style={{ color: '#9ca3af' }} className="text-xs">Specialty</p>
                                  <p style={{ color: '#4a5568' }}>{record.specialty}</p>
                                </div>
                              </div>
                            )}
                            {record.location && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5" style={{ color: '#718096' }} />
                                <div>
                                  <p style={{ color: '#9ca3af' }} className="text-xs">Location</p>
                                  <p style={{ color: '#4a5568' }}>{record.location}</p>
                                </div>
                              </div>
                            )}
                            {record.phone && (
                              <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 mt-0.5" style={{ color: '#718096' }} />
                                <div>
                                  <p style={{ color: '#9ca3af' }} className="text-xs">Phone</p>
                                  <p style={{ color: '#4a5568' }}>{record.phone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Key Information */}
                        <div>
                          {record.diagnosis && (
                            <div className="mb-4">
                              <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-1">
                                DIAGNOSIS
                              </p>
                              <p style={{ color: '#4a5568' }}>{record.diagnosis}</p>
                            </div>
                          )}
                          {record.treatment && (
                            <div className="mb-4">
                              <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-1">
                                TREATMENT
                              </p>
                              <p style={{ color: '#4a5568' }}>{record.treatment}</p>
                            </div>
                          )}
                          {record.testName && (
                            <div className="mb-4">
                              <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-1">
                                TEST
                              </p>
                              <p style={{ color: '#4a5568' }}>{record.testName}</p>
                              <p className="text-sm" style={{ color: '#6b8e7f' }}>
                                Result: <span className="font-semibold">{record.result}</span>
                              </p>
                              <p className="text-xs" style={{ color: '#718096' }}>
                                Normal Range: {record.normalRange}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vitals */}
                      {record.vitals && (
                        <div className="mt-6 p-4 rounded-lg" style={{ background: '#e8f0ed' }}>
                          <p className="font-semibold mb-3" style={{ color: '#4a5568' }}>
                            Vital Signs
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {Object.entries(record.vitals).map(([key, value]) => (
                              <div key={key}>
                                <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium">
                                  {key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p style={{ color: '#6b8e7f' }} className="font-semibold">
                                  {typeof value === 'object' ? JSON.stringify(value) : value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Symptoms */}
                      {record.symptoms && (
                        <div className="mt-4">
                          <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-2">
                            SYMPTOMS REPORTED
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {record.symptoms.map((symptom, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-xs"
                                style={{
                                  background: '#e8f0ed',
                                  color: '#6b8e7f'
                                }}
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {record.recommendations && (
                        <div className="mt-4">
                          <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-2">
                            RECOMMENDATIONS
                          </p>
                          <ul className="space-y-1 text-sm" style={{ color: '#718096' }}>
                            {record.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span style={{ color: '#6b8e7f' }}>•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="mt-6 p-4 rounded-lg" style={{ background: '#fafaf8', border: '1px solid #d4cfc4' }}>
                        <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-2">
                          DETAILED NOTES
                        </p>
                        <p style={{ color: '#718096', lineHeight: '1.6' }}>
                          {record.notes}
                        </p>
                      </div>

                      {/* Additional Info */}
                      {record.interventions && (
                        <div className="mt-4">
                          <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-2">
                            INTERVENTIONS
                          </p>
                          <ul className="space-y-1 text-sm" style={{ color: '#718096' }}>
                            {record.interventions.map((int, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span style={{ color: '#6b8e7f' }}>•</span>
                                {int}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {record.findings && (
                        <div className="mt-4">
                          <p style={{ color: '#9ca3af', fontSize: '12px' }} className="font-medium mb-2">
                            FINDINGS
                          </p>
                          <ul className="space-y-1 text-sm" style={{ color: '#718096' }}>
                            {record.findings.map((finding, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span style={{ color: '#6b8e7f' }}>•</span>
                                {finding}
                              </li>
                            ))}
                          </ul>
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

export default HealthHistory;

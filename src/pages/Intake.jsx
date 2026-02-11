import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useNavigate } from 'react-router-dom';

const Intake = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        primaryConcern: [],
        diagnosisAge: '',
        supportLevel: '',
        sensoryPrefs: [],
        communicationStyle: '',
        coOccurring: []
    });

    const handleCheckbox = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleRadio = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    const finish = () => navigate('/');

    return (
        <div className="max-w-2xl mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold mb-2 text-slate-900">Patient Intake</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className={step >= 1 ? "text-teal-600 font-bold" : ""}>1. Basics</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step >= 2 ? "text-teal-600 font-bold" : ""}>2. Neurodevelopmental</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step >= 3 ? "text-teal-600 font-bold" : ""}>3. Support Needs</span>
                </div>
            </div>

            <Card>
                {step === 1 && (
                    <div className="space-y-6 fade-in">
                        <h2 className="text-xl font-bold text-slate-800">What are your primary areas of focus?</h2>
                        <div className="space-y-3">
                            {['Bipolar Disorder', 'Autism / Neurodivergence', 'Depression', 'Anxiety', 'ADHD'].map(opt => (
                                <label key={opt} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.primaryConcern.includes(opt)}
                                        onChange={() => handleCheckbox('primaryConcern', opt)}
                                        className="w-5 h-5 accent-teal-600 rounded focus:ring-teal-500"
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 fade-in">
                        <h2 className="text-xl font-bold text-slate-800">Neurodevelopmental Profile</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-500 mb-2">Age of Diagnosis (if applicable)</label>
                                <input
                                    type="text"
                                    value={formData.diagnosisAge}
                                    onChange={(e) => setFormData({ ...formData, diagnosisAge: e.target.value })}
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-teal-500 focus:outline-none"
                                    placeholder="e.g. 5 years old, or 'Self-diagnosed'"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-500 mb-2">Communication Style Preference</label>
                                {['Verbal', 'Non-verbal / AAC', 'Mixed / varies by stress level'].map(opt => (
                                    <label key={opt} className="flex items-center gap-2 mb-2 text-slate-700">
                                        <input
                                            type="radio"
                                            name="commStyle"
                                            checked={formData.communicationStyle === opt}
                                            onChange={() => handleRadio('communicationStyle', opt)}
                                            className="accent-teal-600"
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 fade-in">
                        <h2 className="text-xl font-bold text-slate-800">Support & Sensory Needs</h2>

                        <div>
                            <label className="block text-sm text-slate-500 mb-2">Sensory Sensitivities</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Lights', 'Sounds', 'Textures', 'Smells', 'Crowds'].map(opt => (
                                    <label key={opt} className={`p-2 border rounded-lg text-sm text-center cursor-pointer transition-colors ${formData.sensoryPrefs.includes(opt) ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        <input type="checkbox" className="hidden"
                                            checked={formData.sensoryPrefs.includes(opt)}
                                            onChange={() => handleCheckbox('sensoryPrefs', opt)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-500 mb-2">Support Level</label>
                            <select
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:border-teal-500 focus:outline-none"
                                value={formData.supportLevel}
                                onChange={(e) => handleRadio('supportLevel', e.target.value)}
                            >
                                <option value="">Select Level...</option>
                                <option value="1">Level 1 (Requiring Support)</option>
                                <option value="2">Level 2 (Requiring Substantial Support)</option>
                                <option value="3">Level 3 (Requiring Very Substantial Support)</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    <Button variant="ghost" onClick={prevStep} disabled={step === 1}>
                        <ChevronLeft className="w-4 h-4" /> Back
                    </Button>

                    {step < 3 ? (
                        <Button variant="primary" onClick={nextStep}>
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={finish} className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20">
                            Complete Intake <Check className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Intake;

import React from 'react';
import { Upload, Dna, FileText, CheckCircle, AlertOctagon } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import './Genetics.css';

const Genetics = () => {
    return (
        <div className="fade-in main-content-stack">
            <header className="hero-header">
                <h1 className="hero-title">Pharmacogenomics & DNA</h1>
                <p className="hero-description">Optimize your medication based on your genetic profile.</p>
            </header>

            {/* Upload Section */}
            <Card className="upload-card">
                <div className="icon-circle">
                    <Upload className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Upload Genetic Data</h3>
                <p className="text-sm text-slate-500 mb-4">Support for 23andMe, AncestryDNA, or Clinical Lab Files (XML/CSV)</p>
                <Button variant="secondary" className="btnn-primary">Select File</Button>
            </Card>

            {/* Results Analysis */}
            <div className="dna-insights-grid">
                <Card>
                    <h3 className="insight-header"><Dna className="svg" /> Metabolism Status</h3>
                    <div className="insight-stack insight-stack-divided">
                        {[
                            { gene: 'CYP2D6', status: 'Poor Metabolizer', desc: 'May require lower doses of SSRIs.', color: 'text-red-600 bg-red-50 border-red-200' },
                            { gene: 'CYP2C19', status: 'Rapid Metabolizer', desc: 'Standard doses may be ineffective.', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                            { gene: 'COMT', status: 'Val/Val (Warrior)', desc: 'Higher dopamine breakdown; increased stress resilience.', color: 'text-teal-600 bg-teal-50 border-teal-200' },
                        ].map((item, i) => (
                            <div key={i} className="gene-result-card ">
                                <div className="status-badge">
                                    <span className="font-bold text-slate-800">{item.gene}</span>
                                    <span className={`text-xs font-bold ${item.color} uppercase tracking-wide border border-current px-2 py-0.5 rounded`}>{item.status}</span>
                                </div>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="checker-header"><AlertOctagon className="svg" /> Interaction Checker</h3>
                    <p className="text-xs text-slate-500 mb-4">Analysis based on your current med list + genetic profile.</p>

                    <div className="drug-alert">
                        <div className="alert-safe">
                            <CheckCircle className="alert-danger" />
                            <div>
                                <h4 className="font-bold text-green-700 text-sm">Lithium Carbonate</h4>
                                <p className="text-xs text-green-600">Low genetic risk. Standard monitoring recommended.</p>
                            </div>
                        </div>

                        <div className="alert-danger">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 tap" />
                            <div>
                                <h4 className="font-bold text-red-700 text-sm">Fluoxetine (Prozac)</h4>
                                <p className="text-xs text-red-600">Risk: Poor CYP2D6 metabolism. Drug levels may accumulate. Consider Escitalopram instead.</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Helper for the red alert icon since I forgot to import it in destructuring
const AlertTriangle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
);

export default Genetics;

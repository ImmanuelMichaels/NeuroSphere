import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const SignIn = ({ onSignInSuccess, onSwitchToSignUp, onForgotPassword }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Sign in data:', formData);
            setIsLoading(false);
            
            // In production, handle authentication response
            if (onSignInSuccess) {
                onSignInSuccess({
                    email: formData.email,
                    rememberMe: formData.rememberMe
                });
            }
        }, 1500);
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!resetEmail || !emailRegex.test(resetEmail)) {
            return;
        }

        // Simulate sending reset email
        setTimeout(() => {
            setResetEmailSent(true);
            console.log('Password reset email sent to:', resetEmail);
        }, 1000);
    };

    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{
                background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
                fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
            }}>
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 rounded-2xl" style={{ background: '#fff9f0' }}>
                                <Mail className="w-10 h-10" style={{ color: '#d4a574' }} />
                            </div>
                        </div>
                        <h1 className="text-3xl font-semibold mb-2" style={{ color: '#4a5568' }}>
                            Reset Password
                        </h1>
                        <p style={{ color: '#718096', fontSize: '15px' }}>
                            We'll send you instructions to reset your password
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="p-8 rounded-2xl shadow-sm mb-6" style={{
                        background: '#fafaf8',
                        border: '2px solid #d4cfc4'
                    }}>
                        {!resetEmailSent ? (
                            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Mail className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                        </div>
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="your.email@example.com"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl"
                                            style={{
                                                background: '#fafaf8',
                                                border: '2px solid #d4cfc4',
                                                color: '#4a5568',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-xl font-semibold transition-all"
                                    style={{
                                        background: '#6b8e7f',
                                        color: '#ffffff',
                                        minHeight: '56px',
                                        fontSize: '16px'
                                    }}
                                >
                                    Send Reset Instructions
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="w-full py-3 rounded-xl font-medium transition-all"
                                    style={{
                                        background: '#f0ebe5',
                                        color: '#718096',
                                        fontSize: '15px'
                                    }}
                                >
                                    Back to Sign In
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <div className="mb-6">
                                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: '#e8f0ed' }}>
                                        <CheckCircle2 className="w-8 h-8" style={{ color: '#6b8e7f' }} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#4a5568' }}>
                                        Check Your Email
                                    </h3>
                                    <p style={{ color: '#718096', fontSize: '15px', lineHeight: '1.6' }}>
                                        We've sent password reset instructions to <strong>{resetEmail}</strong>
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmailSent(false);
                                        setResetEmail('');
                                    }}
                                    className="w-full py-4 rounded-xl font-semibold transition-all"
                                    style={{
                                        background: '#6b8e7f',
                                        color: '#ffffff',
                                        minHeight: '56px',
                                        fontSize: '16px'
                                    }}
                                >
                                    Return to Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{
            background: 'linear-gradient(135deg, #f5f3ef 0%, #e8e5df 100%)',
            fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif"
        }}>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-2xl" style={{ background: '#e8f0ed' }}>
                            <LogIn className="w-10 h-10" style={{ color: '#6b8e7f' }} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-semibold mb-2" style={{ color: '#4a5568' }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: '#718096', fontSize: '15px' }}>
                        Sign in to continue your health journey
                    </p>
                </div>

                {/* Form Card */}
                <div className="p-8 rounded-2xl shadow-sm mb-6" style={{
                    background: '#fafaf8',
                    border: '2px solid #d4cfc4'
                }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Mail className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="your.email@example.com"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl"
                                    style={{
                                        background: '#fafaf8',
                                        border: `2px solid ${errors.email ? '#c87355' : '#d4cfc4'}`,
                                        color: '#4a5568',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Lock className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    className="w-full pl-12 pr-12 py-3 rounded-xl"
                                    style={{
                                        background: '#fafaf8',
                                        border: `2px solid ${errors.password ? '#c87355' : '#d4cfc4'}`,
                                        color: '#4a5568',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                    style={{ color: '#9ca3af' }}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded cursor-pointer"
                                    style={{ accentColor: '#6b8e7f' }}
                                />
                                <span className="text-sm" style={{ color: '#718096' }}>
                                    Remember me
                                </span>
                            </label>

                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm font-medium"
                                style={{ color: '#6b8e7f' }}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-semibold transition-all"
                            style={{
                                background: isLoading ? '#9ca3af' : '#6b8e7f',
                                color: '#ffffff',
                                minHeight: '56px',
                                fontSize: '16px',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p style={{ color: '#718096', fontSize: '15px' }}>
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToSignUp}
                            className="font-semibold"
                            style={{ color: '#6b8e7f' }}
                        >
                            Sign Up
                        </button>
                    </p>
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
                }

                input:focus {
                    border-color: #6b8e7f !important;
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SignIn;

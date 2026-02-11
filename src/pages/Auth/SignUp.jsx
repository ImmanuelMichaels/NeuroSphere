import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Calendar, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const SignUp = ({ onSignUpSuccess, onSwitchToSignIn }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Password strength calculator
    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Update password strength
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Phone validation (optional but format check if provided)
        if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        // Date of birth validation
        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        } else {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13) {
                newErrors.dateOfBirth = 'You must be at least 13 years old';
            }
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            console.log('Sign up data:', formData);
            setIsLoading(false);
            
            // In production, handle response and navigate
            if (onSignUpSuccess) {
                onSignUpSuccess({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email
                });
            }
        }, 2000);
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength === 0) return '#e8e5df';
        if (passwordStrength <= 2) return '#c87355';
        if (passwordStrength <= 3) return '#d4a574';
        return '#6b8e7f';
    };

    const getPasswordStrengthLabel = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength <= 2) return 'Weak';
        if (passwordStrength <= 3) return 'Medium';
        return 'Strong';
    };

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
                            <UserPlus className="w-10 h-10" style={{ color: '#6b8e7f' }} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-semibold mb-2" style={{ color: '#4a5568' }}>
                        Create Your Account
                    </h1>
                    <p style={{ color: '#718096', fontSize: '15px' }}>
                        Join NeuroPulse for comprehensive health management
                    </p>
                </div>

                {/* Form Card */}
                <div className="p-8 rounded-2xl shadow-sm mb-6" style={{
                    background: '#fafaf8',
                    border: '2px solid #d4cfc4'
                }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                    First Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <User className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                    </div>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="John"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl"
                                        style={{
                                            background: '#fafaf8',
                                            border: `2px solid ${errors.firstName ? '#c87355' : '#d4cfc4'}`,
                                            color: '#4a5568',
                                            fontSize: '15px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                {errors.firstName && (
                                    <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Doe"
                                    className="w-full px-4 py-3 rounded-xl"
                                    style={{
                                        background: '#fafaf8',
                                        border: `2px solid ${errors.lastName ? '#c87355' : '#d4cfc4'}`,
                                        color: '#4a5568',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Email Address *
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
                                    placeholder="john.doe@example.com"
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

                        {/* Phone (Optional) */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Phone Number (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Phone className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl"
                                    style={{
                                        background: '#fafaf8',
                                        border: `2px solid ${errors.phone ? '#c87355' : '#d4cfc4'}`,
                                        color: '#4a5568',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Date of Birth *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Calendar className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                </div>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl"
                                    style={{
                                        background: '#fafaf8',
                                        border: `2px solid ${errors.dateOfBirth ? '#c87355' : '#d4cfc4'}`,
                                        color: '#4a5568',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            {errors.dateOfBirth && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.dateOfBirth}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Password *
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
                                    placeholder="Create a strong password"
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
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-2 rounded-full" style={{ background: '#e8e5df' }}>
                                            <div 
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${(passwordStrength / 5) * 100}%`,
                                                    background: getPasswordStrengthColor()
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium" style={{ color: getPasswordStrengthColor() }}>
                                            {getPasswordStrengthLabel()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {errors.password && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#718096' }}>
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Lock className="w-5 h-5" style={{ color: '#9ca3af' }} />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Re-enter your password"
                                    className="w-full pl-12 pr-12 py-3 rounded-xl"
                                    style={{
                                        background: '#fafaf8',
                                        border: `2px solid ${errors.confirmPassword ? '#c87355' : '#d4cfc4'}`,
                                        color: '#4a5568',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                    style={{ color: '#9ca3af' }}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#6b8e7f' }}>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Passwords match
                                </p>
                            )}
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#c87355' }}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Privacy Notice */}
                        <div className="p-4 rounded-xl" style={{
                            background: '#e8f0ed',
                            border: '1px solid #b8d4a8'
                        }}>
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 mt-0.5" style={{ color: '#6b8e7f' }} />
                                <p className="text-xs" style={{ color: '#4a5568', lineHeight: '1.6' }}>
                                    Your health data is encrypted and HIPAA-compliant. We never share your information without explicit consent.
                                </p>
                            </div>
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
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                    <p style={{ color: '#718096', fontSize: '15px' }}>
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToSignIn}
                            className="font-semibold"
                            style={{ color: '#6b8e7f' }}
                        >
                            Sign In
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

export default SignUp;

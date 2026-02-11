import React, { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
  value = '',
  onChange,
  placeholder = 'Enter password',
  label = 'Password',
  error = '',
  disabled = false,
  showStrength = true,
  required = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Calculate password strength
  const strength = useMemo(() => {
    if (!value) return { level: 0, label: '', color: '' };

    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;

    if (score < 2) return { level: 1, label: 'Weak', color: 'var(--danger)' };
    if (score < 4) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score < 6) return { level: 3, label: 'Good', color: '#3b82f6' };
    return { level: 4, label: 'Strong', color: 'var(--success)' };
  }, [value]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }}> *</span>}
        </label>
        {showStrength && value && (
          <div style={{ fontSize: 12, fontWeight: 500 }}>
            Strength:
            <span style={{ marginLeft: 6, color: strength.color }}>
              {strength.label}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 6,
            border: error ? '1px solid var(--danger)' : '1px solid var(--muted)',
            fontSize: 14,
            backgroundColor: disabled ? 'var(--disabled)' : 'transparent',
            color: disabled ? 'var(--muted)' : 'inherit',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            padding: 0,
            borderRadius: 6,
            border: '1px solid var(--muted)',
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: disabled ? 'var(--muted)' : 'var(--primary)',
            transition: 'all 0.2s',
          }}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i < strength.level ? strength.color : 'var(--muted)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {error && <div style={{ color: 'var(--danger)', marginTop: 6, fontSize: 12 }}>{error}</div>}
    </div>
  );
};

export default PasswordInput;

import React, { useState } from 'react';
import { Chrome, Github, Linkedin } from 'lucide-react';

const SocialLogin = ({ onSuccess, disabled = false }) => {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      color: '#EA4335',
      hoverBg: '#f8e4e1',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: '#333333',
      hoverBg: '#f0f0f0',
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: (props) => (
        <svg
          viewBox="0 0 21 21"
          fill="currentColor"
          {...props}
        >
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
      ),
      color: '#0078D4',
      hoverBg: '#f0f6ff',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: '#0077B5',
      hoverBg: '#e8f4f8',
    },
  ];

  const handleSocialLogin = async (provider) => {
    setLoading(provider.id);
    setError('');

    try {
      // Simulate OAuth flow - in production, this would redirect to OAuth endpoints
      await new Promise((r) => setTimeout(r, 1000));

      // Mock success - store provider info in localStorage
      localStorage.setItem(
        'authProvider',
        JSON.stringify({
          provider: provider.id,
          timestamp: new Date().toISOString(),
        })
      );

      // Call success callback
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess({
          provider: provider.id,
          email: `user@${provider.id}.com`,
          name: `${provider.name} User`,
        });
      }
    } catch (err) {
      setError(`${provider.name} login failed. Please try again.`);
      console.warn(`Social login error: ${provider.id}`, err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--muted)' }} />
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--muted)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        {socialProviders.map((provider) => {
          const Icon = provider.icon;
          const isLoading = loading === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => handleSocialLogin(provider)}
              disabled={disabled || isLoading || !!loading}
              type="button"
              title={`Sign in with ${provider.name}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 8,
                border: `2px solid ${provider.color}20`,
                background: isLoading ? provider.hoverBg : 'transparent',
                cursor: disabled || isLoading || !!loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: disabled || isLoading || !!loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!disabled && !loading) {
                  e.currentTarget.style.background = provider.hoverBg;
                  e.currentTarget.style.borderColor = provider.color;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = `${provider.color}20`;
              }}
            >
              <Icon size={20} style={{ color: provider.color }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: provider.color }}>
                {isLoading ? 'Signing in...' : provider.name}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 6,
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: 12,
            border: '1px solid #fecaca',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default SocialLogin;

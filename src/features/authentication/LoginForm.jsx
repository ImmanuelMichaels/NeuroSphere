// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Button from '../../../components/UI/Button';
// import Card from '../../../components/UI/Card';
// import PasswordInput from './PasswordInput';
// import SocialLogin from './SocialLogin';

// const emailRegex = /^\S+@\S+\.\S+$/;

// const LoginForm = ({ onLogin }) => {  const navigate = useNavigate();	const [email, setEmail] = useState(() => {
// 		try {
// 			return localStorage.getItem('rememberedEmail') || '';
// 		} catch {
// 			return '';
// 		}
// 	});
// 	const [password, setPassword] = useState('');
// 	const [remember, setRemember] = useState(() => {
// 		try {
// 			return !!localStorage.getItem('rememberedEmail');
// 		} catch {
// 			return false;
// 		}
// 	});
// 	const [loading, setLoading] = useState(false);
// 	const [error, setError] = useState('');

// 	useEffect(() => {
// 		setError('');
// 	}, [email, password]);

// 	const validate = () => {
// 		if (!email || !emailRegex.test(email)) {
// 			setError('Please enter a valid email address.');
// 			return false;
// 		}
// 		if (!password) {
// 			setError('Please enter your password.');
// 			return false;
// 		}
// 		return true;
// 	};

// 	const handleSubmit = async (e) => {
// 		e.preventDefault();
// 		if (!validate()) return;
// 		setLoading(true);
// 		setError('');
// 		try {
// 			if (onLogin && typeof onLogin === 'function') {
// 				await onLogin({ email, password });
// 			} else {
// 				// Mock login: simulate network delay and accept any credentials
// 				await new Promise((r) => setTimeout(r, 700));
// 				localStorage.setItem('authToken', 'demo-token');
// 			}

// 			try {
// 				if (remember) localStorage.setItem('rememberedEmail', email);
// 				else localStorage.removeItem('rememberedEmail');
// 			} catch {}

//       // Redirect to dashboard on success
//       navigate('/');
// 		}
// 	};

// 	return (
// 		<Card className="auth-card">
// 			<h2 style={{ marginTop: 0 }}>Sign in</h2>
// 			<form onSubmit={handleSubmit}>
// 				<div style={{ marginBottom: 12 }}>
// 					<label style={{ display: 'block', marginBottom: 6 }}>Email</label>
// 					<input
// 						type="email"
// 						value={email}
// 						onChange={(e) => setEmail(e.target.value)}
// 						placeholder="you@domain.com"
// 						required
// 						style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--muted)' }}
// 					/>
// 				</div>

// <PasswordInput
// 				value={password}
// 				onChange={setPassword}
// 				label="Password"
// 				placeholder="Your password"
// 				error={error && error.includes('password') ? error : ''}
// 				showStrength={false}
// 			/>

// 				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
// 					<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
// 						<input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
// 					</label>
// 					<a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>Forgot?</a>
// 				</div>

// 				{error && <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}

// 				<div>
// 					<Button type="submit" disabled={loading} style={{ width: '100%' }}>
// 						{loading ? 'Signing in…' : 'Sign in'}
// 					</Button>
// 				</div>
// 			</form>
// 			<SocialLogin onSuccess={(data) => {
// 				localStorage.setItem('authToken', 'demo-token');
// 				navigate('/');
// 			}} disabled={loading} />
// 			<div style={{ marginTop: 12, fontSize: 14 }}>
// 				Don’t have an account? <a href="#" onClick={(e) => e.preventDefault()}>Sign up</a>
// 			</div>
// 		</Card>
// 	);
// };

// export default LoginForm;

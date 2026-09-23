import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthProps {
  mode: 'signup' | 'login';
  onToggleMode: () => void;
  onBack: () => void;
}

export default function Auth({ mode, onToggleMode, onBack }: AuthProps) {
  const { signUp, signIn, resetPassword } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignup) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const result = await signUp(name.trim(), email.trim(), password);
        if (result.error) setError(result.error);
      } else {
        const result = await signIn(email.trim(), password);
        if (result.error) setError(result.error);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above, then tap "Send Reset Link".');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setForgotSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="auth-page">
        <div className="auth-inner">
          <button className="back-btn" onClick={() => { setShowForgot(false); setForgotSent(false); setError(null); }} id="forgot-back-btn">
            ‹ Back
          </button>
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p className="auth-sub">
              {forgotSent
                ? 'Check your email for a password reset link.'
                : 'Enter your email and we\'ll send you a reset link.'}
            </p>
          </div>

          {!forgotSent && (
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
              {error && <div className="auth-error" role="alert">{error}</div>}

              <div className="form-group">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                id="forgot-submit-btn"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {forgotSent && (
            <div className="auth-success" role="status">
              <div className="auth-success-icon">✉️</div>
              <p>We've sent a reset link to <strong>{email}</strong>.</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                Didn't get it? Check your spam folder.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <button className="back-btn" onClick={onBack} id="auth-back-btn">
          ‹ Back
        </button>

        <div className="auth-header">
          <div className="auth-logo">🔥</div>
          <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="auth-sub">
            {isSignup
              ? 'Start tracking your habits today.'
              : 'Log in to continue your streaks.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}

          {isSignup && (
            <div className="form-group">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                maxLength={50}
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus={!isSignup}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="auth-submit-btn"
          >
            {loading
              ? (isSignup ? 'Creating Account...' : 'Logging In...')
              : (isSignup ? 'Create Account' : 'Log In')}
          </button>
        </form>

        {!isSignup && (
          <button
            className="auth-forgot-btn"
            onClick={() => { setShowForgot(true); setError(null); }}
            id="auth-forgot-btn"
          >
            Forgot password?
          </button>
        )}

        <div className="auth-toggle">
          {isSignup ? (
            <p>
              Already have an account?{' '}
              <button className="auth-link" onClick={onToggleMode} id="auth-switch-login">
                Log in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button className="auth-link" onClick={onToggleMode} id="auth-switch-signup">
                Get started
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

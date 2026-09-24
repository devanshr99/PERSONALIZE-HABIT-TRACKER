/**
 * Auth Page — Polished, commercial-grade authentication experience
 * Includes Welcome Back (Login), Create your account ✨ (Sign Up), and Password Reset.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthProps {
  mode: 'signup' | 'login';
  onToggleMode: () => void;
  onBack?: () => void;
}

// ─── Inline Clean SVGs ────────────────────────────────────────────────────────

function IconEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-.722-3.25" />
      <path d="M2 2l20 20" />
      <path d="M8.71 8.71a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Auth Component ──────────────────────────────────────────────────────────

export default function Auth({ mode, onToggleMode, onBack }: AuthProps) {
  const { signUp, signIn, resetPassword } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const isSignup = mode === 'signup';

  // Validation helpers
  const isPasswordLongEnough = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (isSignup) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (!isPasswordLongEnough) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignup) {
        const result = await signUp(name.trim(), cleanEmail, password);
        if (result.error) setError(result.error);
      } else {
        const result = await signIn(cleanEmail, password);
        if (result.error) setError(result.error);
      }
    } catch {
      setError('Something went wrong connecting to authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address to receive a reset link.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await resetPassword(cleanEmail);
      if (result.error) {
        setError(result.error);
      } else {
        setForgotSent(true);
      }
    } catch {
      setError('Failed to send reset link. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password View ──────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <button
            type="button"
            className="auth-back-link"
            onClick={() => {
              setShowForgot(false);
              setForgotSent(false);
              setError(null);
            }}
            id="forgot-back-btn"
          >
            ‹ Back to login
          </button>

          <div className="auth-brand">
            <div className="auth-logo-badge">
              <span className="auth-logo-icon" aria-hidden="true">🔥</span>
            </div>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              {forgotSent
                ? 'Check your inbox for a password reset email.'
                : "Enter your email and we'll send you a secure link to reset your password."}
            </p>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          {!forgotSent ? (
            <form className="auth-form" onSubmit={handleForgotPassword} noValidate>
              <div className="auth-field">
                <label htmlFor="forgot-email" className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconEmail /></span>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    autoFocus
                    className="auth-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
                id="forgot-submit-btn"
              >
                {loading ? (
                  <span className="btn-spinner-wrap">
                    <span className="spinner" /> Sending Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="auth-success-card">
              <div className="auth-success-icon">✉️</div>
              <h3 className="auth-success-title">Check your email</h3>
              <p className="auth-success-text">
                We've dispatched a recovery link to <strong>{email}</strong>.
              </p>
              <p className="auth-success-hint">
                Didn't see it? Check your spam or promotions tab.
              </p>
              <button
                type="button"
                className="btn btn-secondary auth-submit-btn"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setShowForgot(false);
                  setForgotSent(false);
                }}
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Main Login / Create Account View ──────────────────────────────────────
  return (
    <div className="auth-container">
      {/* Decorative ambient background aura */}
      <div className="auth-ambient-glow" aria-hidden="true" />

      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back-link" onClick={onBack} id="auth-back-btn">
            ‹ Back
          </button>
        )}

        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-logo-badge">
            <span className="auth-logo-icon" aria-hidden="true">🔥</span>
          </div>
          <div className="auth-app-tag">Habit Streak Tracker</div>
          <h1 className="auth-title">
            {isSignup ? 'Create your account ✨' : 'Welcome Back 👋'}
          </h1>
          <p className="auth-subtitle">
            {isSignup
              ? 'Start building better habits, one day at a time.'
              : 'Log in to continue your streaks.'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name Field (Sign Up only) */}
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-name" className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><IconUser /></span>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Devansh Rastogi"
                  autoComplete="name"
                  maxLength={50}
                  required
                  autoFocus
                  className="auth-input"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><IconEmail /></span>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                autoFocus={!isSignup}
                className="auth-input"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="auth-password" className="auth-label">Password</label>
              {!isSignup && (
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setShowForgot(true);
                    setError(null);
                  }}
                  id="auth-forgot-btn"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><IconLock /></span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={6}
                required
                className="auth-input has-toggle"
              />
              <button
                type="button"
                className="auth-toggle-pwd-btn"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up only) */}
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-confirm" className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="auth-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="auth-input has-toggle"
                />
                <button
                  type="button"
                  className="auth-toggle-pwd-btn"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="auth-password-hints">
                  <div className={`pwd-hint-item ${isPasswordLongEnough ? 'met' : ''}`}>
                    <span className="hint-check"><IconCheck /></span>
                    <span>At least 6 characters</span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className={`pwd-hint-item ${doPasswordsMatch ? 'met' : ''}`}>
                      <span className="hint-check"><IconCheck /></span>
                      <span>Passwords match</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="btn-spinner-wrap">
                <span className="spinner" />
                {isSignup ? 'Creating Account...' : 'Logging In...'}
              </span>
            ) : (
              <span>{isSignup ? 'Create Account' : 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="auth-toggle-footer">
          {isSignup ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={onToggleMode}
                id="auth-switch-login"
              >
                Log in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={onToggleMode}
                id="auth-switch-signup"
              >
                Create account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

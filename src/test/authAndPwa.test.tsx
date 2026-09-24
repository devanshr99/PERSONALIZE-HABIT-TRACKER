import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Auth from '../pages/Auth';
import InstallPrompt from '../components/InstallPrompt';
import { PwaProvider } from '../context/PwaContext';

// Mock useAuth
const mockSignUp = vi.fn().mockResolvedValue({});
const mockSignIn = vi.fn().mockResolvedValue({});
const mockResetPassword = vi.fn().mockResolvedValue({});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signUp: mockSignUp,
    signIn: mockSignIn,
    signOut: vi.fn(),
    resetPassword: mockResetPassword,
  }),
}));

describe('Auth Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Login view with required elements', () => {
    const onToggleMode = vi.fn();
    render(<Auth mode="login" onToggleMode={onToggleMode} />);

    expect(screen.getByText('Welcome Back 👋')).toBeInTheDocument();
    expect(screen.getByText('Log in to continue your streaks.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Log In$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('navigates to registration when clicking Create account', () => {
    const onToggleMode = vi.fn();
    render(<Auth mode="login" onToggleMode={onToggleMode} />);

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });

  it('renders Create Account view with required fields', () => {
    const onToggleMode = vi.fn();
    render(<Auth mode="signup" onToggleMode={onToggleMode} />);

    expect(screen.getByText('Create your account ✨')).toBeInTheDocument();
    expect(screen.getByText('Start building better habits, one day at a time.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Create Account$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument();
  });

  it('toggles password visibility between password and text input', () => {
    render(<Auth mode="login" onToggleMode={vi.fn()} />);

    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    const hideBtn = screen.getByLabelText(/Hide password/i);
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('validates signup passwords match and displays inline error if mismatch', async () => {
    render(<Auth mode="signup" onToggleMode={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Devansh' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'secret456' } });

    fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('switches to forgot password screen and back', () => {
    render(<Auth mode="login" onToggleMode={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));
    expect(screen.getByText('Reset Password')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /‹ Back to login/i }));
    expect(screen.getByText('Welcome Back 👋')).toBeInTheDocument();
  });
});

describe('PWA InstallPrompt Component', () => {
  it('renders nothing when not installable and no banner requested', () => {
    const { container } = render(
      <PwaProvider>
        <InstallPrompt />
      </PwaProvider>
    );

    expect(container.querySelector('.install-prompt-overlay')).toBeNull();
  });
});

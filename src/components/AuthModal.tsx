import React, { useEffect, useRef, useState } from 'react';
import { User, UserRole } from '../types';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Compass,
  LayoutDashboard,
  QrCode,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            theme: 'outline';
            size: 'large';
            text: 'continue_with';
            shape: 'rectangular';
            width: number;
          }) => void;
        };
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleIdentityScriptPromise = null;
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });
  return googleIdentityScriptPromise;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, message: string, token: string) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('0712345678');
  const [role, setRole] = useState<UserRole>('attendee');
  const [organizationName, setOrganizationName] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  // Password Reset Fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requiresPortalCode, setRequiresPortalCode] = useState(false);
  const [googleSignInError, setGoogleSignInError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      if (initialMode === 'signup') {
        setRole('attendee');
        setAdminSecret('');
      }
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen || (authMode !== 'login' && authMode !== 'signup') || role !== 'attendee' || !googleButtonRef.current) return;

    let active = true;
    const initializeGoogleSignIn = async () => {
      setGoogleSignInError(null);
      try {
        const configResponse = await fetch('/api/auth/google/config');
        const config = await configResponse.json();
        if (!configResponse.ok || typeof config.clientId !== 'string' || !config.clientId) {
          throw new Error(config.error || 'Google sign-in is not configured yet.');
        }

        await loadGoogleIdentityScript();
        if (!active || !googleButtonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async ({ credential }) => {
            setLoading(true);
            setGoogleSignInError(null);
            try {
              const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential }),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || 'Google sign-in failed.');
              onAuthSuccess(data.user, `Signed in with Google as ${data.user.email}`, data.token);
              onClose();
            } catch (error) {
              setGoogleSignInError(error instanceof Error ? error.message : 'Google sign-in failed.');
            } finally {
              setLoading(false);
            }
          },
        });
        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.max(200, Math.min(googleButtonRef.current.clientWidth, 400)),
        });
      } catch (error) {
        if (active) {
          setGoogleSignInError(error instanceof Error ? error.message : 'Google sign-in is unavailable.');
        }
      }
    };

    void initializeGoogleSignIn();
    return () => {
      active = false;
    };
  }, [authMode, isOpen, onAuthSuccess, onClose, role]);

  if (!isOpen) return null;

  // Handle Email + Password Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          portalRole: role === 'attendee' ? undefined : role,
          portalCode: adminSecret.trim().toUpperCase(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRequiresPortalCode(Boolean(data.requiresCode));
        setErrorMessage(data.error || 'Failed to sign in');
        return;
      }

      setRequiresPortalCode(false);
      onAuthSuccess(data.user, `Welcome back, ${data.user.name}!`, data.token);
      onClose();
    } catch {
      setErrorMessage('Network error during login. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone.startsWith('+254') ? phone : '+254' + phone.replace(/^0/, ''),
          password,
          role,
          organizationName: role === 'organizer' ? organizationName : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed');
        return;
      }

      if (data.pendingApproval) {
        setSuccessMessage(data.message);
        setAuthMode('login');
        return;
      }

      onAuthSuccess(data.user, `Account created successfully! Welcome to TiketiPass, ${data.user.name}.`, data.token);
      onClose();
    } catch {
      setErrorMessage('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Dispatch Code
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your account email.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.code) {
        setResetCode(data.code);
      }
      setSuccessMessage(data.message || 'Reset code sent to your email.');
      setTimeout(() => {
        setAuthMode('reset');
        setSuccessMessage(null);
      }, 1200);
    } catch {
      setErrorMessage('Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Password reset failed');
        return;
      }

      setSuccessMessage(data.message);
      setPassword(newPassword);
      setTimeout(() => {
        setAuthMode('login');
        setSuccessMessage(null);
      }, 1800);
    } catch {
      setErrorMessage('Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLoginRole = (roleType: UserRole) => {
    setRole(roleType);
    setEmail('');
    setPassword('');
    setAdminSecret('');
    setRequiresPortalCode(false);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-amber-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-violet-600/30 mb-2">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {authMode === 'login' && 'Sign in to TiketiPass'}
            {authMode === 'signup' && 'Create your Account'}
            {authMode === 'forgot' && 'Reset your Password'}
            {authMode === 'reset' && 'Set New Password'}
          </h2>

          <p className="text-xs text-slate-400">
            {authMode === 'login' && 'Access your digital tickets, gate scanner, or organizer dashboard'}
            {authMode === 'signup' && 'Select your role and get verified passes instantly'}
            {authMode === 'forgot' && "Enter your registered email to receive a 6-digit OTP code"}
            {authMode === 'reset' && 'Enter your verification code and choose a new password'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= MODE: LOGIN ================= */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Choose your account type
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('attendee')}
                  aria-pressed={role === 'attendee'}
                  className={`px-3 py-2 rounded-xl font-bold border text-center transition cursor-pointer ${
                    role === 'attendee'
                      ? 'bg-violet-950/50 text-violet-200 border-violet-700'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  Attendee
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('organizer')}
                  aria-pressed={role === 'organizer'}
                  className={`px-3 py-2 rounded-xl font-bold border text-center transition cursor-pointer ${
                    role === 'organizer'
                      ? 'bg-amber-950/50 text-amber-200 border-amber-700'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  Event Organizer
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('gate_staff')}
                  aria-pressed={role === 'gate_staff'}
                  className={`px-3 py-2 rounded-xl font-bold border text-center transition cursor-pointer ${
                    role === 'gate_staff'
                      ? 'bg-emerald-950/50 text-emerald-200 border-emerald-700'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  Gate Verifier
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLoginRole('super_admin')}
                  aria-pressed={role === 'super_admin'}
                  className={`px-3 py-2 rounded-xl font-bold border text-center transition cursor-pointer ${
                    role === 'super_admin'
                      ? 'bg-red-950/50 text-red-200 border-red-700'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAdminSecret('');
                    setRequiresPortalCode(false);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setAuthMode('forgot');
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-11 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security Authorization Code for Privileged Role Login */}
            {role !== 'attendee' && (
              <div className="space-y-1.5 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-amber-300 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Portal Security Code</span>
                  </label>
                </div>
                <input
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value.toUpperCase())}
                  placeholder="Enter code provided by Super Admin"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Attendees cannot enter staff or admin portals without an authorized security code.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google Authentication Button */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              {role === 'attendee' && (
                <>
                  <div ref={googleButtonRef} className="flex min-h-10 justify-center" />
                  {googleSignInError && (
                    <p role="alert" className="text-center text-xs text-amber-300">{googleSignInError}</p>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setRole('attendee');
                  setOrganizationName('');
                  setAdminSecret('');
                  setAuthMode('signup');
                }}
                className="w-full py-2.5 bg-violet-600/15 hover:bg-violet-600/25 text-violet-200 rounded-xl text-xs font-extrabold border border-violet-500/40 flex items-center justify-center space-x-2 transition"
              >
                <UserIcon className="w-4 h-4" />
                <span>Don't have an account? Create Account</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE: SIGNUP ================= */}
        {authMode === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">Account Type</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {([
                  ['attendee', 'Attendee'],
                  ['gate_staff', 'Gate Verifier'],
                  ['organizer', 'Event Organizer'],
                  ['super_admin', 'Super Admin'],
                ] as const).map(([accountRole, label]) => (
                  <button
                    key={accountRole}
                    type="button"
                    onClick={() => setRole(accountRole)}
                    aria-pressed={role === accountRole}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      role === accountRole
                        ? 'border-violet-500 bg-violet-950/40 text-white ring-1 ring-violet-500/50'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {role !== 'attendee' && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
                {role === 'organizer'
                  ? 'Organizer accounts require administrator approval before portal access is enabled.'
                  : `${role === 'gate_staff' ? 'Gate Verifier' : 'Super Admin'} accounts require administrator approval before access is enabled.`}
              </div>
            )}

            {role === 'organizer' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Organization Name</label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-9 pr-11 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
            >
              <span>
                {loading
                  ? role === 'attendee' ? 'Creating Account...' : 'Submitting Request...'
                  : role === 'attendee' ? 'Create Account' : 'Request Account Approval'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google Authentication Button */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              {role === 'attendee' && (
                <div ref={googleButtonRef} className="flex min-h-10 justify-center [&>svg]:hidden [&>span]:hidden">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </div>
              )}

              {googleSignInError && (
                <p role="alert" className="text-center text-xs text-amber-300">{googleSignInError}</p>
              )}

              <p className="text-center text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setAuthMode('login');
                  }}
                  className="text-violet-400 hover:text-violet-300 font-bold"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ================= MODE: FORGOT PASSWORD ================= */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">Account Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-violet-600/30 transition disabled:opacity-50"
            >
              <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
              <KeyRound className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setAuthMode('login');
              }}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white text-center"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* ================= MODE: RESET PASSWORD ================= */}
        {authMode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="e.g. 849201"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-center font-mono text-base tracking-widest focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 pr-11 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((visible) => !visible)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  aria-pressed={showNewPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 pr-11 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <span>{loading ? 'Updating Password...' : 'Save Password & Sign In'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setAuthMode('login');
              }}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white text-center"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

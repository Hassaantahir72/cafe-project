'use client';
import { useState, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, CheckCircle, RefreshCw, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'login' | 'verify' | 'forgot' | 'reset';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ otp: ['','','','','',''], newPassword: '', confirmPassword: '' });
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState(['','','','','','']);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(r => { if (r <= 1) { clearInterval(interval); return 0; } return r - 1; });
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! ☕`);
      router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/');
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.requiresVerification) {
        setPendingEmail(errData.email);
        setOtp(['','','','','','']);
        setStep('verify');
        startTimer();
        toast.error('Please verify your email first. New OTP sent!');
      } else {
        toast.error(errData?.error || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!/^\d*$/.test(val)) return;
    setter(prev => { const n = [...prev]; n[idx] = val.slice(-1); return n; });
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent, arr: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !arr[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent, setter: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setter(pasted.split('')); refs.current[5]?.focus(); }
  };

  const handleVerifyLogin = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter all 6 digits');
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ email: pendingEmail, otp: code });
      setAuth(data.user, data.token);
      toast.success('Email verified! Welcome ☕');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
      setOtp(['','','','','','']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResendVerify = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authAPI.resendOTP(pendingEmail);
      startTimer();
      setOtp(['','','','','','']);
      otpRefs.current[0]?.focus();
      toast.success('New OTP sent!');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to resend'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      setPendingEmail(forgotEmail);
      setResetForm({ otp: ['','','','','',''], newPassword: '', confirmPassword: '' });
      setStep('reset');
      startTimer();
      toast.success('Reset code sent if account exists');
    } catch { toast.error('Failed to send reset code'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    const code = resetForm.otp.join('');
    if (code.length < 6) return toast.error('Enter all 6 digits');
    if (resetForm.newPassword !== resetForm.confirmPassword) return toast.error('Passwords do not match');
    if (resetForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email: pendingEmail, otp: code, newPassword: resetForm.newPassword });
      toast.success('Password reset! Please log in.');
      setStep('login');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Reset failed'); }
    finally { setLoading(false); }
  };

  const OtpBoxes = ({ value, onChange, onKeyDown, onPaste, refs }: any) => (
    <div className="flex gap-3 justify-center mb-6" onPaste={onPaste}>
      {value.map((digit: string, idx: number) => (
        <input key={idx} ref={(el: HTMLInputElement | null) => { refs.current[idx] = el; }}
          value={digit} onChange={e => onChange(idx, e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => onKeyDown(idx, e)}
          maxLength={1} inputMode="numeric" autoComplete="one-time-code"
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-cafe-300 bg-warm-50 ${digit ? 'border-cafe-500 bg-white text-warm-900' : 'border-warm-200 text-warm-900'}`}
          autoFocus={idx === 0} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.svg" alt="Brewed Awakening" className="w-20 h-20 mx-auto mb-3" />
            <p className="font-serif text-xl font-bold text-warm-900">Brewed Awakening</p>
            <p className="text-warm-400 text-sm">Café & Coffee House</p>
          </Link>
        </div>

        {/* ── LOGIN ── */}
        {step === 'login' && (
          <div className="card p-8 animate-fade-in">
            <h1 className="text-2xl font-serif font-bold text-warm-900 mb-1">Welcome back</h1>
            <p className="text-warm-400 text-sm mb-7">Sign in to your account</p>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="you@example.com" required autoFocus />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label mb-0">Password</label>
                  <button type="button" onClick={() => { setForgotEmail(form.email); setStep('forgot'); }}
                    className="text-xs text-cafe-600 hover:underline font-medium">Forgot password?</button>
                </div>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input pr-11" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-sm text-warm-500 mt-6">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-cafe-600 font-medium hover:underline">Create one</Link>
            </p>
          </div>
        )}

        {/* ── EMAIL VERIFY (after login attempt with unverified account) ── */}
        {step === 'verify' && (
          <div className="card p-8 animate-fade-in">
            <button onClick={() => setStep('login')} className="flex items-center gap-1.5 text-warm-400 hover:text-warm-700 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cafe-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-cafe-500" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-warm-900 mb-2">Verify your email</h1>
              <p className="text-warm-500 text-sm">We sent a code to <span className="font-semibold text-warm-800">{pendingEmail}</span></p>
            </div>
            <OtpBoxes value={otp} onChange={(i: number, v: string) => handleOtpChange(i, v, otpRefs, setOtp)}
              onKeyDown={(i: number, e: React.KeyboardEvent) => handleOtpKeyDown(i, e, otp, otpRefs)}
              onPaste={(e: React.ClipboardEvent) => handleOtpPaste(e, setOtp, otpRefs)} refs={otpRefs} />
            <button onClick={handleVerifyLogin} disabled={loading || otp.join('').length < 6}
              className="btn-primary w-full py-3.5 mb-4 flex items-center justify-center gap-2">
              {loading ? 'Verifying...' : <><CheckCircle className="w-4 h-4" /> Verify & Sign In</>}
            </button>
            <div className="text-center text-sm text-warm-500">
              {resendTimer > 0 ? (
                <span className="flex items-center justify-center gap-1.5 text-warm-400">
                  <RefreshCw className="w-3.5 h-3.5" /> Resend in {resendTimer}s
                </span>
              ) : (
                <button onClick={handleResendVerify} disabled={loading} className="text-cafe-600 font-medium hover:underline">Resend OTP</button>
              )}
            </div>
          </div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {step === 'forgot' && (
          <div className="card p-8 animate-fade-in">
            <button onClick={() => setStep('login')} className="flex items-center gap-1.5 text-warm-400 hover:text-warm-700 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
            <h1 className="text-2xl font-serif font-bold text-warm-900 mb-2">Forgot password?</h1>
            <p className="text-warm-400 text-sm mb-7">Enter your email and we'll send a reset code.</p>
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  className="input" placeholder="you@example.com" required autoFocus />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </div>
        )}

        {/* ── RESET PASSWORD ── */}
        {step === 'reset' && (
          <div className="card p-8 animate-fade-in">
            <button onClick={() => setStep('forgot')} className="flex items-center gap-1.5 text-warm-400 hover:text-warm-700 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cafe-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-cafe-500" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-warm-900 mb-2">Enter reset code</h1>
              <p className="text-warm-500 text-sm">Sent to <span className="font-semibold text-warm-800">{pendingEmail}</span></p>
            </div>
            <OtpBoxes
              value={resetForm.otp}
              onChange={(i: number, v: string) => handleOtpChange(i, v, resetOtpRefs, (val: any) => setResetForm(f => ({ ...f, otp: typeof val === 'function' ? val(f.otp) : val })))}
              onKeyDown={(i: number, e: React.KeyboardEvent) => handleOtpKeyDown(i, e, resetForm.otp, resetOtpRefs)}
              onPaste={(e: React.ClipboardEvent) => handleOtpPaste(e, (val: any) => setResetForm(f => ({ ...f, otp: typeof val === 'function' ? val(f.otp) : val })), resetOtpRefs)}
              refs={resetOtpRefs} />
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showNewPw ? 'text' : 'password'} value={resetForm.newPassword}
                    onChange={e => setResetForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="input pr-11" placeholder="At least 8 characters" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" value={resetForm.confirmPassword}
                  onChange={e => setResetForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="input" placeholder="Repeat new password" />
                {resetForm.confirmPassword && resetForm.newPassword !== resetForm.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">Passwords do not match</p>
                )}
              </div>
            </div>
            <button onClick={handleReset} disabled={loading || resetForm.otp.join('').length < 6}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {loading ? 'Resetting...' : <><CheckCircle className="w-4 h-4" /> Reset Password</>}
            </button>
            <div className="text-center mt-4 text-sm text-warm-500">
              {resendTimer > 0 ? (
                <span className="text-warm-400">Resend in {resendTimer}s</span>
              ) : (
                <button onClick={handleForgot} className="text-cafe-600 font-medium hover:underline">Resend code</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

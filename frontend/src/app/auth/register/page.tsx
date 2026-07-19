'use client';
import { useState, useRef, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, CheckCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'register' | 'verify';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('register');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      setEmail(form.email);
      setStep('verify');
      setResendTimer(60);
      toast.success('OTP sent! Check your email inbox.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Please enter all 6 digits');
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ email, otp: code });
      setAuth(data.user, data.token);
      toast.success('Email verified! Welcome to Brewed Awakening ☕');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authAPI.resendOTP(email);
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      toast.success('New OTP sent! Check your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo.svg" alt="Brewed Awakening" className="w-20 h-20 mx-auto mb-3" />
            <p className="font-serif text-xl font-bold text-warm-900">Brewed Awakening</p>
            <p className="text-warm-400 text-sm">Café & Coffee House</p>
          </Link>
        </div>

        {/* ── STEP 1: Registration Form ── */}
        {step === 'register' && (
          <div className="card p-8 animate-fade-in">
            <h1 className="text-2xl font-serif font-bold text-warm-900 mb-1">Create Account</h1>
            <p className="text-warm-400 text-sm mb-7">Join us and earn loyalty points on every order</p>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="label">Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="input" placeholder="Your full name" required autoFocus />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="label">Phone Number <span className="text-warm-400 font-normal">(optional)</span></label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="input" placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="input pr-11" placeholder="At least 8 characters" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    className="input pr-11" placeholder="Repeat your password" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">Passwords do not match</p>
                )}
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[
                      form.password.length >= 8,
                      /[A-Z]/.test(form.password),
                      /[0-9]/.test(form.password),
                      /[^A-Za-z0-9]/.test(form.password),
                    ].map((ok, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${ok ? 'bg-green-400' : 'bg-warm-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-warm-400">
                    {form.password.length < 8 ? 'At least 8 characters' :
                     !/[A-Z]/.test(form.password) ? 'Add an uppercase letter' :
                     !/[0-9]/.test(form.password) ? 'Add a number' :
                     !/[^A-Za-z0-9]/.test(form.password) ? 'Add a symbol for a stronger password' :
                     '✓ Strong password'}
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
                className="btn-primary w-full py-3.5 text-base">
                {loading ? 'Creating account...' : 'Create Account & Send OTP'}
              </button>
            </form>

            <p className="text-center text-sm text-warm-500 mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-cafe-600 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 'verify' && (
          <div className="card p-8 animate-fade-in">
            <button onClick={() => setStep('register')} className="flex items-center gap-1.5 text-warm-400 hover:text-warm-700 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cafe-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-cafe-500" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-warm-900 mb-2">Check your email</h1>
              <p className="text-warm-500 text-sm leading-relaxed">
                We sent a 6-digit verification code to<br/>
                <span className="font-semibold text-warm-800">{email}</span>
              </p>
            </div>

            {/* OTP input boxes */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpRefs.current[idx] = el; }}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-cafe-300 bg-warm-50
                    ${digit ? 'border-cafe-500 bg-white text-warm-900' : 'border-warm-200 text-warm-900'}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button onClick={handleVerify} disabled={loading || otp.join('').length < 6}
              className="btn-primary w-full py-3.5 text-base mb-5 flex items-center justify-center gap-2">
              {loading ? 'Verifying...' : <><CheckCircle className="w-5 h-5" /> Verify Email</>}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-warm-500 text-sm mb-2">Didn't receive the code?</p>
              {resendTimer > 0 ? (
                <p className="text-warm-400 text-sm flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend in <span className="font-semibold text-warm-700">{resendTimer}s</span>
                </p>
              ) : (
                <button onClick={handleResend} disabled={loading}
                  className="text-cafe-600 font-medium text-sm hover:underline disabled:opacity-50">
                  Resend OTP
                </button>
              )}
            </div>

            <div className="mt-6 p-4 bg-warm-50 rounded-xl border border-warm-100">
              <p className="text-xs text-warm-400 text-center leading-relaxed">
                Code expires in <strong className="text-warm-600">10 minutes</strong>. 
                Check your spam folder if you don't see it in your inbox.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

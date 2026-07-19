'use client';
import { useState } from 'react';
import { reservationsAPI } from '@/lib/api';
import { CalendarDays, Users, Clock, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30'];

export default function ReservationsPage() {
  const [step, setStep] = useState<'form'|'success'|'lookup'>('form');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [lookupCode, setLookupCode] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    guests: 2, reservation_date: '', reservation_time: '',
    special_requests: ''
  });

  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await reservationsAPI.book(form);
      setConfirmation(data);
      setStep('success');
      toast.success('Table reserved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await reservationsAPI.lookup(lookupCode.toUpperCase());
      setConfirmation(data);
      setStep('success');
    } catch {
      toast.error('Reservation not found. Check your confirmation code.');
    } finally { setLoading(false); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  if (step === 'success' && confirmation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-serif font-bold text-warm-900 mb-3">Table Reserved!</h1>
        <p className="text-warm-500 mb-8">We're looking forward to seeing you.</p>
        <div className="card p-6 text-left space-y-4 mb-8">
          <div className="text-center pb-4 border-b border-warm-100">
            <p className="text-sm text-warm-400 mb-1">Confirmation Code</p>
            <p className="text-2xl font-bold text-cafe-600 tracking-widest">{confirmation.confirmation_code}</p>
          </div>
          {[
            ['Guest', confirmation.customer_name],
            ['Date', confirmation.reservation_date],
            ['Time', confirmation.reservation_time?.slice(0,5)],
            ['Guests', confirmation.guests],
            ['Status', confirmation.status?.toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-warm-400">{k}</span>
              <span className="font-medium text-warm-800">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setStep('form'); setConfirmation(null); setForm({ customer_name:'',customer_email:'',customer_phone:'',guests:2,reservation_date:'',reservation_time:'',special_requests:'' }); }}
          className="btn-outline">Make Another Reservation</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <div className="mb-10">
        <p className="text-cafe-500 font-medium uppercase tracking-widest text-sm mb-2">Reservations</p>
        <h1 className="section-title">Reserve Your Table</h1>
        <p className="section-sub">Secure your perfect spot in advance</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setStep('form')} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${step==='form'?'bg-cafe-500 text-white':'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>New Reservation</button>
        <button onClick={() => setStep('lookup')} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${step==='lookup'?'bg-cafe-500 text-white':'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>Look Up Reservation</button>
      </div>

      {step === 'lookup' ? (
        <form onSubmit={handleLookup} className="card p-8 space-y-5">
          <div>
            <label className="label">Confirmation Code</label>
            <input value={lookupCode} onChange={e => setLookupCode(e.target.value)} placeholder="e.g. RESABC123"
              className="input" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> {loading ? 'Searching...' : 'Find Reservation'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} className="input" placeholder="Your name" required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} className="input" placeholder="+1 234 567 8900" required />
            </div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} className="input" placeholder="you@example.com" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Guests</label>
              <select value={form.guests} onChange={e => set('guests', parseInt(e.target.value))} className="input">
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Date</label>
              <input type="date" min={minDate} value={form.reservation_date} onChange={e => set('reservation_date', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Time</label>
              <select value={form.reservation_time} onChange={e => set('reservation_time', e.target.value)} className="input" required>
                <option value="">Select time</option>
                {TIME_SLOTS.map((t: any) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Special Requests <span className="text-warm-400 font-normal">(optional)</span></label>
            <textarea value={form.special_requests} onChange={e => set('special_requests', e.target.value)} className="input" rows={3} placeholder="Dietary requirements, celebrations, high chair needed..." />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
            {loading ? 'Reserving...' : 'Confirm Reservation'}
          </button>
          <p className="text-center text-xs text-warm-400">We'll hold your table for 15 minutes after the reservation time.</p>
        </form>
      )}
    </div>
  );
}

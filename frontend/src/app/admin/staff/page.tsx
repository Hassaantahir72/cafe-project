'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Plus, Trash2, X, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    adminAPI.getStaff().then(r => setStaff(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const { data } = await adminAPI.addStaff(form);
      setStaff(prev => [...prev, data]);
      setModal(false);
      setForm({ name: '', email: '', password: '', phone: '', role: 'staff' });
      toast.success('Staff member added!');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from staff?`)) return;
    try {
      await adminAPI.deleteStaff(id);
      setStaff(prev => prev.filter((s: any) => s.id !== id));
      toast.success('Staff member removed');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl border border-warm-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-warm-50 border-b border-warm-100">
            <tr>{['Name', 'Email', 'Phone', 'Role', 'Joined', 'Action'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-warm-50">
            {loading ? Array.from({length: 3}).map((_, i) => (
              <tr key={i} className="animate-pulse">{Array.from({length: 6}).map((_,j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-warm-100 rounded"/></td>)}</tr>
            )) : staff.map((s: any) => (
              <tr key={s.id} className="hover:bg-warm-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cafe-100 rounded-full flex items-center justify-center">
                      <span className="text-cafe-600 text-sm font-bold">{s.name?.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-warm-800 text-sm">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-warm-600">{s.email}</td>
                <td className="px-4 py-4 text-sm text-warm-600">{s.phone || '—'}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.role === 'admin' ? 'bg-cafe-100 text-cafe-700' : 'bg-warm-100 text-warm-600'}`}>
                    {s.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />} {s.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-warm-400">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-4">
                  {s.id !== user?.id && s.role !== 'admin' && (
                    <button onClick={() => handleDelete(s.id, s.name)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-warm-100">
              <h2 className="font-semibold text-warm-900">Add Staff Member</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-warm-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="label">Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input" required /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" required /></div>
              <div><label className="label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" /></div>
              <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input" required /></div>
              <div><label className="label">Role</label>
                <select value={form.role} onChange={e => set('role', e.target.value)} className="input">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-warm-100">
              <button onClick={() => setModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 btn-primary">{saving ? 'Adding...' : 'Add Staff'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Shield, Monitor, Trash2, RefreshCw, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSecurityPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string|null>(null);

  const load = () => {
    setLoading(true);
    adminAPI.getActiveSessions()
      .then(r => setSessions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const revokeSession = async (jti: string) => {
    if (!confirm('Revoke this session? That user will be logged out immediately.')) return;
    setRevoking(jti);
    try {
      await adminAPI.revokeSession(jti);
      setSessions(prev => prev.filter(s => s.token_jti !== jti));
      toast.success('Session revoked');
    } catch { toast.error('Failed to revoke session'); }
    finally { setRevoking(null); }
  };

  const parseUA = (ua: string) => {
    if (!ua) return 'Unknown device';
    if (ua.includes('Mobile')) return '📱 Mobile browser';
    if (ua.includes('Chrome')) return '🖥️ Chrome';
    if (ua.includes('Firefox')) return '🦊 Firefox';
    if (ua.includes('Safari')) return '🌐 Safari';
    return '🖥️ Desktop browser';
  };

  const roleGroups = {
    admin: sessions.filter(s => s.role === 'admin'),
    staff: sessions.filter(s => s.role === 'staff'),
    customer: sessions.filter(s => s.role === 'customer'),
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Admin Sessions', count: roleGroups.admin.length, icon: Shield, color: 'text-red-500 bg-red-50' },
          { label: 'Staff Sessions', count: roleGroups.staff.length, icon: Users, color: 'text-blue-500 bg-blue-50' },
          { label: 'Customer Sessions', count: roleGroups.customer.length, icon: Monitor, color: 'text-green-500 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-warm-100 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold text-warm-900">{s.count}</p><p className="text-sm text-warm-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Security info */}
      <div className="bg-white rounded-xl border border-warm-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-warm-800">Active Security Protections</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            'JWT token blacklisting on logout',
            'Brute-force login protection (5 attempts/IP)',
            'OTP rate limiting (60s cooldown)',
            'SQL injection detection & logging',
            'XSS input sanitization',
            'CORS restricted to frontend origin',
            'All admin actions audit-logged',
            'Session auto-revoke on password reset',
            '30-minute admin inactivity timeout',
            'Bcrypt cost-14 password hashing',
            'Security headers (HSTS, CSP, X-Frame)',
            'Real-time unauthorized access alerts',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-warm-600">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Active sessions table */}
      <div className="bg-white rounded-xl border border-warm-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-warm-500" />
            <h2 className="font-semibold text-warm-800">Active Sessions ({sessions.length})</h2>
          </div>
          <button onClick={load} className="p-2 rounded-lg hover:bg-warm-50 transition-colors">
            <RefreshCw className={`w-4 h-4 text-warm-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>{['User', 'Role', 'IP Address', 'Device', 'Last Active', 'Started', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {loading ? Array.from({length: 5}).map((_,i) => (
                <tr key={i} className="animate-pulse">{Array.from({length:7}).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-100 rounded"/></td>)}</tr>
              )) : sessions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-warm-400">No active sessions</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-warm-800 text-sm">{s.user_name}</p>
                    <p className="text-xs text-warm-400">{s.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.role==='admin' ? 'bg-red-100 text-red-700' :
                      s.role==='staff' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-warm-600">{s.ip_address || '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-500">{parseUA(s.user_agent)}</td>
                  <td className="px-4 py-3 text-xs text-warm-400">{new Date(s.last_active).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-warm-400">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => revokeSession(s.token_jti)} disabled={revoking===s.token_jti}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

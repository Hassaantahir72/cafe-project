'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { authAPI, ordersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { User, Shield, Monitor, Trash2, Star, ShoppingBag, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setAuth, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'profile'|'orders'|'security'>('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [orders, setOrders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { if (!user) router.push('/auth/login'); }, [user]);

  useEffect(() => {
    if (tab === 'orders' && !orders.length) {
      ordersAPI.myOrders().then(r => setOrders(r.data)).catch(() => {});
    }
    if (tab === 'security') {
      authAPI.getSessions().then(r => setSessions(r.data)).catch(() => {});
    }
  }, [tab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authAPI.update(form);
      setAuth(data, localStorage.getItem('cafe_token') || '');
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSavingProfile(false); }
  };

  const handleRevokeAll = async () => {
    if (!confirm('This will log you out on all other devices. Continue?')) return;
    try {
      await authAPI.revokeAllSessions();
      setSessions(prev => prev.slice(0, 1));
      toast.success('All other sessions revoked');
    } catch { toast.error('Failed'); }
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    router.push('/');
  };

  if (!user) return null;

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'orders',  label: 'My Orders', icon: ShoppingBag },
    { key: 'security',label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-cafe-500 rounded-2xl flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900">{user.name}</h1>
          <p className="text-warm-400 text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-cafe-100 text-cafe-700 px-2 py-0.5 rounded-full font-medium">
              ⭐ {user.loyalty_points || 0} loyalty points
            </span>
            {user.is_verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-xl mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab===t.key ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-warm-800">Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input" required />
            </div>
            <div>
              <label className="label">Email <span className="text-warm-400 font-normal">(cannot be changed)</span></label>
              <input value={user.email} className="input opacity-60 cursor-not-allowed" disabled />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="input" placeholder="+1 234 567 8900" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={savingProfile} className="btn-primary px-6">{savingProfile ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-sm transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="card p-12 text-center text-warm-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Your order history will appear here</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-warm-900">{order.order_number}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-warm-900">${parseFloat(order.total).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status==='delivered' ? 'bg-green-100 text-green-700' :
                    order.status==='cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-cafe-100 text-cafe-700'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-warm-500">
                {order.items?.filter((i:any)=>i.name).slice(0,3).map((i:any)=>`${i.name}×${i.qty}`).join(', ')}
                {order.items?.length > 3 && ` +${order.items.length-3} more`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-warm-500" />
                <h2 className="font-semibold text-warm-800">Active Sessions</h2>
                <span className="text-xs bg-warm-100 text-warm-600 px-2 py-0.5 rounded-full">{sessions.length}</span>
              </div>
              {sessions.length > 1 && (
                <button onClick={handleRevokeAll} className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline">
                  Sign out all other devices
                </button>
              )}
            </div>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-warm-400 text-sm">No active sessions found</p>
              ) : sessions.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-warm-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${i===0 ? 'bg-green-400' : 'bg-warm-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-warm-800">
                        {s.user_agent?.includes('Mobile') ? '📱 Mobile' : '🖥️ Desktop'}
                        {i === 0 && <span className="ml-2 text-xs text-green-600 font-medium">(current)</span>}
                      </p>
                      <p className="text-xs text-warm-400">{s.ip_address} · Last active {new Date(s.last_active).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-warm-800 mb-2">Password</h2>
            <p className="text-sm text-warm-400 mb-4">To change your password, use the forgot password flow from the login page.</p>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-sm transition-colors">
              <LogOut className="w-4 h-4" /> Sign out all devices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  CalendarDays, Users, Settings, LogOut,
  Menu, X, ChevronRight, Shield, ScrollText, Coffee
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/reservations', icon: CalendarDays, label: 'Reservations' },
  { href: '/admin/menu', icon: UtensilsCrossed, label: 'Menu' },
  { href: '/admin/staff', icon: Users, label: 'Staff' },
  { href: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { href: '/admin/security', icon: Shield, label: 'Security' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

// Auto-logout after 30 min of inactivity
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  // Guard: only admin can access
  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (!isAdmin()) { router.replace('/'); }
  }, [user]);

  // Track activity for auto-logout
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setTimeoutWarning(false);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity));
    return () => events.forEach(e => window.removeEventListener(e, resetActivity));
  }, [resetActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivity;
      if (idle > INACTIVITY_TIMEOUT - 2 * 60 * 1000) setTimeoutWarning(true);
      if (idle > INACTIVITY_TIMEOUT) {
        handleLogout();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  const handleLogout = async () => {
    try { await authAPI.logout?.(); } catch {}
    logout();
    router.push('/auth/login');
  };

  if (!user || !isAdmin()) return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="flex items-center gap-3 text-warm-400">
        <Shield className="w-5 h-5" />
        <span>Verifying access...</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-warm-50 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Inactivity Warning */}
      {timeoutWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-900 text-yellow-100 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm">
          <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>You'll be logged out soon due to inactivity.</span>
          <button onClick={resetActivity} className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded-lg font-medium transition-colors">Stay logged in</button>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-warm-900 flex flex-col z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-warm-800">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="logo" className="w-10 h-10" />
            <div>
              <p className="text-white font-serif font-bold text-sm leading-tight">Brewed Awakening</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3 h-3 text-cafe-400" />
                <p className="text-cafe-400 text-xs font-medium">Admin Panel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${active ? 'bg-cafe-500 text-white shadow-sm' : 'text-warm-400 hover:bg-warm-800 hover:text-white'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-warm-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-warm-800">
            <div className="w-8 h-8 bg-cafe-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-warm-500 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-warm-400 hover:text-red-400 text-sm px-3 py-2 w-full rounded-xl hover:bg-warm-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-warm-100 px-6 h-16 flex items-center gap-4 shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-warm-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-warm-800 capitalize text-lg">
            {NAV.find(n => n.href === pathname)?.label || 'Admin'}
          </h1>
          <div className="ml-auto flex items-center gap-2 text-xs text-warm-400">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>Secure session</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

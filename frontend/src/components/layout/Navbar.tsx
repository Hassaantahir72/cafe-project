'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import CartDrawer from '@/components/ui/CartDrawer';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCartStore(s => s.count());
  const { user, logout, isAdmin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/reservations', label: 'Reserve' },
    { href: '/order-tracking', label: 'Track Order' },
  ];

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    logout();
    setUserMenuOpen(false);
    toast.success('Signed out successfully');
    router.push('/');
  };

  return (
    <>
      <nav className={`sticky top-0 z-30 transition-all duration-500 ${
        scrolled || !isHome
          ? 'bg-white/95 backdrop-blur-md border-b border-warm-100 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Brewed Awakening" className="w-9 h-9" />
            <span className={`font-serif text-lg font-bold transition-colors ${scrolled||!isHome ? 'text-warm-900' : 'text-white'} hover:text-cafe-500`}>Brewed Awakening</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`font-medium text-sm transition-colors ${scrolled||!isHome ? 'text-warm-600 hover:text-cafe-600' : 'text-white/90 hover:text-cafe-300'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl hover:bg-cafe-50 transition-colors">
              <ShoppingBag className="w-5 h-5 text-warm-700" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-cafe-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-cafe-50 transition-colors">
                  <div className="w-8 h-8 bg-cafe-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-warm-100 py-2 w-56 z-50">
                      <div className="px-4 py-3 border-b border-warm-100">
                        <p className="font-semibold text-warm-900 text-sm">{user.name}</p>
                        <p className="text-xs text-warm-400 truncate">{user.email}</p>
                        {isAdmin() && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs bg-cafe-100 text-cafe-700 px-2 py-0.5 rounded-full font-medium">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>
                      {isAdmin() && (
                        <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-cafe-50 text-sm text-warm-700 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-cafe-500" /> Admin Dashboard
                        </Link>
                      )}
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-warm-50 text-sm text-warm-700 transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <div className="border-t border-warm-100 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 w-full transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:flex btn-primary text-sm py-2 px-4">
                Sign In
              </Link>
            )}

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-cafe-50 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-warm-100 bg-white px-4 py-4 flex flex-col gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="text-warm-700 font-medium py-2.5 px-3 rounded-xl hover:bg-warm-50 transition-colors">
                {l.label}
              </Link>
            ))}
            {!user ? (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-primary text-center text-sm mt-2">
                Sign In
              </Link>
            ) : (
              <button onClick={handleLogout} className="text-red-500 font-medium py-2.5 px-3 text-left rounded-xl hover:bg-red-50 transition-colors mt-1">
                Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

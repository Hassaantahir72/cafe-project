import Link from 'next/link';
import CafeStatus from '@/components/ui/CafeStatus';
import { Coffee, Instagram, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-warm-900 text-warm-300 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="Brewed Awakening" className="w-10 h-10" />
            <span className="text-white font-serif text-xl font-bold">Brewed Awakening</span>
          </div>
          <p className="text-warm-400 leading-relaxed mb-6 max-w-sm">
            Where every cup tells a story. We source the finest beans, bake fresh daily, and pour our heart into every drink we serve.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 rounded-lg bg-warm-800 hover:bg-cafe-600 transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-lg bg-warm-800 hover:bg-cafe-600 transition-colors"><Facebook className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm">
            {[['/', 'Home'], ['/menu', 'Our Menu'], ['/reservations', 'Reserve a Table'], ['/order-tracking', 'Track Order'], ['/auth/login', 'Sign In']].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-cafe-400 transition-colors">{label}</Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Visit Us</h4>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-cafe-400 mt-0.5 shrink-0" /><span>42 Maple Street, Downtown</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-cafe-400 shrink-0" /><span>+1 (555) 123-4567</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-cafe-400 shrink-0" /><span>hello@brewedawakening.com</span></div>
            <div className="flex items-start gap-2 mt-2">
              <Clock className="w-4 h-4 text-cafe-400 mt-0.5 shrink-0" />
              <CafeStatus variant="full" className="text-warm-300" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pt-8 border-t border-warm-800 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-warm-500">
        <p>© {new Date().getFullYear()} Brewed Awakening. All rights reserved.</p>
        <p>Made with ♥ and good coffee</p>
      </div>
    </footer>
  );
}

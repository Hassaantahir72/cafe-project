'use client';
import { useState, useEffect } from 'react';

// Cafe hours config (must match backend)
const HOURS = {
  weekday: { open: { h: 7, m: 0 }, close: { h: 21, m: 0 }, label: 'Mon–Fri 7:00 AM – 9:00 PM' },
  weekend: { open: { h: 8, m: 0 }, close: { h: 22, m: 0 }, label: 'Sat–Sun 8:00 AM – 10:00 PM' },
};

function getCafeStatus() {
  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const schedule = isWeekend ? HOURS.weekend : HOURS.weekday;
  const totalMins = now.getHours() * 60 + now.getMinutes();
  const openMins = schedule.open.h * 60 + schedule.open.m;
  const closeMins = schedule.close.h * 60 + schedule.close.m;
  const isOpen = totalMins >= openMins && totalMins < closeMins;
  const minsUntilClose = closeMins - totalMins;
  const minsUntilOpen = totalMins < openMins ? openMins - totalMins : (openMins + 1440) - totalMins;
  const closingSoon = isOpen && minsUntilClose <= 60;

  const fmt = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return {
    isOpen,
    closingSoon,
    isWeekend,
    opensAt: fmt(schedule.open.h, schedule.open.m),
    closesAt: fmt(schedule.close.h, schedule.close.m),
    minsUntilClose,
    minsUntilOpen,
    schedule,
    hoursLabel: schedule.label,
  };
}

interface Props {
  variant?: 'badge' | 'inline' | 'full';
  className?: string;
}

export default function CafeStatus({ variant = 'badge', className = '' }: Props) {
  const [status, setStatus] = useState(getCafeStatus());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => setStatus(getCafeStatus()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        {status.isOpen
          ? status.closingSoon
            ? `Closing soon · ${status.closesAt}`
            : `Open · Closes ${status.closesAt}`
          : `Closed · Opens ${status.opensAt}`
        }
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          status.isOpen
            ? status.closingSoon
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
              : 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {status.isOpen ? (status.closingSoon ? '⚠️ Closing Soon' : '✅ Open Now') : '🔴 Closed'}
        </span>
        <span className="text-sm text-warm-500">
          {status.isOpen
            ? `Until ${status.closesAt}`
            : `Opens ${status.opensAt}`}
        </span>
      </div>
    );
  }

  // full variant — for footer/contact/homepage
  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
        status.isOpen
          ? status.closingSoon
            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
            : 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          status.isOpen
            ? status.closingSoon ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
            : 'bg-red-500'
        }`} />
        {status.isOpen
          ? status.closingSoon
            ? `Closing in ${status.minsUntilClose} min`
            : `Open Now · Closes at ${status.closesAt}`
          : `Closed · Opens at ${status.opensAt}`
        }
      </div>
      <div className="text-xs text-warm-400 space-y-0.5">
        <p>Mon–Fri: 7:00 AM – 9:00 PM</p>
        <p>Sat–Sun: 8:00 AM – 10:00 PM</p>
      </div>
    </div>
  );
}

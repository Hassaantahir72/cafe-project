'use client';
import { useEffect, useState } from 'react';

export default function PageProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-warm-100">
      <div className="h-full bg-gradient-to-r from-cafe-400 to-cafe-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }} />
    </div>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import Chatbot from '@/components/chatbot/Chatbot';
import ScrollReveal from '@/components/ui/ScrollReveal';
import PageProgress from '@/components/ui/PageProgress';

export const metadata: Metadata = {
  title: 'Brewed Awakening — Café & Coffee House',
  description: 'Where every cup tells a story. Specialty coffee, artisan pastries and a warm cozy atmosphere.',
  openGraph: {
    title: 'Brewed Awakening',
    description: 'Where every cup tells a story.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <PageProgress />
        <Navbar />
        <main className="min-h-screen page-enter">{children}</main>
        <Footer />
        <Chatbot />
        <ScrollReveal />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#28251f', color: '#fdf8f0', borderRadius: '14px', fontSize: '14px', fontWeight: 500, padding: '12px 16px', border: '1px solid rgba(196,132,58,.3)' },
            success: { iconTheme: { primary: '#c4843a', secondary: '#fdf8f0' } },
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}

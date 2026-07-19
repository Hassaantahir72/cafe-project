'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { menuAPI } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { ArrowRight, Star, Clock, Leaf, Plus, Coffee, ChevronDown, MapPin, Wifi, Music, Truck } from 'lucide-react';
import CafeStatus from '@/components/ui/CafeStatus';


const FALLBACK_IMAGES: Record<string, string> = {
  'hot-drinks':  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
  'cold-drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  'breakfast':   'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  'sandwiches':  'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  'pastries':    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  'salads':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

function imgWithFallback(src: string | null, slug: string) {
  return src || FALLBACK_IMAGES[slug] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80';
}

export default function HomePage() {
  const [featured, setFeatured]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allItems, setAllItems]   = useState<any[]>([]);
  const [loaded, setLoaded]       = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    setLoaded(true);
    menuAPI.getItems({ featured: 'true' }).then(r => setFeatured(r.data.slice(0, 6))).catch(() => {});
    menuAPI.getCategories().then(r => setCategories(r.data)).catch(() => {});
    menuAPI.getItems().then(r => setAllItems(r.data)).catch(() => {});
  }, []);

  // Parallax
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handler = () => el.style.setProperty('--py', `${window.scrollY * 0.35}px`);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleAdd = (item: any) => {
    addItem({ id: item.id, name: item.name, price: parseFloat(item.price), image_url: item.image_url });
    // inline toast-like feedback via button pulse — no import needed
  };

  // Pick one representative image per category
  const getCatImage = (slug: string) => {
    const item = allItems.find(i => i.category_slug === slug && i.image_url);
    return item?.image_url || null;
  };

  const CATEGORY_EMOJI: Record<string,string> = {
    'hot-drinks':'☕','cold-drinks':'🧊','breakfast':'🌅','sandwiches':'🥪','pastries':'🥐','salads':'🥗',
  };

  // Story images — pick 4 diverse items that actually have images
  const storyItems = allItems.filter(i => i.image_url).slice(0, 4);

  const testimonials = [
    { name:'Sarah M.', text:'Best flat white in the city. The atmosphere is pure magic!', rating:5, avatar:'S' },
    { name:'James K.', text:'I come here every morning. The cinnamon rolls are life-changing.', rating:5, avatar:'J' },
    { name:'Priya R.', text:'The acai bowl and matcha latte combo is absolutely perfect.', rating:5, avatar:'P' },
  ];

  const AMENITIES = [
    { icon: <Wifi className="w-7 h-7 text-cafe-500"/>,   title:'Free WiFi',      sub:'High-speed throughout' },
    { icon: <span className="text-3xl">🐾</span>,        title:'Pet Friendly',   sub:'Outdoor patio available' },
    { icon: <Music className="w-7 h-7 text-cafe-500"/>,  title:'Live Music',     sub:'Every Friday evening' },
    { icon: <Truck className="w-7 h-7 text-cafe-500"/>,  title:'Delivery',       sub:'Within 5km radius' },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
        {/* BG blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cafe-500/10 rounded-full blur-3xl" style={{transform:'translateY(var(--py,0))'}} />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-cafe-400/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
          {/* Left */}
          <div className={`transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-8">
              <CafeStatus variant="badge" className="bg-cafe-500/15 border border-cafe-500/30 backdrop-blur-sm rounded-full px-5 py-2 text-cafe-300" />
            </div>
            <h1 className="font-display text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
              Where Every<br />
              <span className="text-gradient">Cup Tells</span><br />
              a Story.
            </h1>
            <p className="text-warm-300 text-lg font-light leading-relaxed mb-10 max-w-md">
              Specialty coffee sourced from single-origin farms, artisan pastries baked at dawn, and a space that feels like home.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/menu" className="btn-primary text-base py-4 px-8 flex items-center gap-2 group">
                Explore Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </Link>
              <Link href="/reservations" className="glass border border-white/20 text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-xl transition-all">
                Reserve Table
              </Link>
            </div>
            <div className="flex gap-8">
              {[['2k+','Happy Customers'],['22','Menu Items'],['4.9★','Average Rating']].map(([v,l]) => (
                <div key={l}>
                  <p className="text-2xl font-display font-bold text-white">{v}</p>
                  <p className="text-warm-400 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image mosaic */}
          <div className={`hidden lg:grid grid-cols-2 gap-3 transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            {featured.slice(0,4).map((item, i) => (
              <div key={item.id}
                className={`relative rounded-2xl overflow-hidden group cursor-pointer
                  ${i === 0 ? 'row-span-2' : 'h-40'}`}>
                {item.image_url
                  ? <img src={imgWithFallback(item.image_url, item.category_slug)} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e)=>{const t=e.target as HTMLImageElement;const fb=FALLBACK_IMAGES[item.category_slug];if(fb&&t.src!==fb)t.src=fb;}} />
                  : <div className="w-full h-full bg-warm-800 flex items-center justify-center text-4xl">{CATEGORY_EMOJI[item.category_slug]||'☕'}</div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <div>
                    <p className="text-white text-sm font-semibold">{item.name}</p>
                    <p className="text-cafe-300 text-xs">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-warm-400 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4"/>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <div className="bg-cafe-500 py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array(2).fill([
            '☕ Specialty Coffee','🫘 Single-Origin Beans','🥐 Fresh Pastries',
            '🍵 Matcha Lattes','🌿 Vegan Options','🎵 Live Music Fridays',
            '📶 Free WiFi','🐾 Pet Friendly Patio',
          ]).flat().map((item, i) => (
            <span key={i} className="text-white font-medium text-sm px-8 border-r border-white/20 last:border-0">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-cafe-500 font-semibold uppercase tracking-[4px] text-xs mb-4">Explore</p>
          <h2 className="section-title">Our Menu</h2>
          <p className="section-sub">Something for every moment of your day</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.length === 0
            ? Array.from({length:6}).map((_,i) => (
                <div key={i} className="aspect-square rounded-2xl bg-warm-100 animate-pulse"/>
              ))
            : categories.map((cat, i) => {
                const img = getCatImage(cat.slug);
                return (
                  <Link key={cat.id} href={`/menu?category=${cat.slug}`}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-square flex flex-col items-center justify-end p-4 bg-warm-900 hover:scale-[1.03] transition-transform duration-300">
                    {img
                      ? <img src={img} alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
                      onError={(e)=>{const t=e.target as HTMLImageElement;const fb=FALLBACK_IMAGES[cat.slug];if(fb&&t.src!==fb)t.src=fb;else t.style.display='none';}} />
                      : <div className="absolute inset-0 flex items-center justify-center text-5xl bg-warm-800">{CATEGORY_EMOJI[cat.slug]||'🍽️'}</div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
                    <div className="relative z-10 text-center">
                      <p className="text-white font-semibold text-sm leading-tight">{cat.name}</p>
                      <p className="text-cafe-300 text-xs mt-0.5">{allItems.filter(i=>i.category_slug===cat.slug).length} items</p>
                    </div>
                  </Link>
                );
              })
          }
        </div>
      </section>

      {/* ── FEATURED / MENU HIGHLIGHTS ───────────────────── */}
      <section className="bg-warm-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px, #c4843a 1px, transparent 0)',backgroundSize:'32px 32px'}}/>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-14">
            <p className="text-cafe-400 font-semibold uppercase tracking-[4px] text-xs mb-4">Chef's Pick</p>
            <h2 className="section-title text-white">Menu Highlights</h2>
            <p className="text-warm-400 text-lg font-light mt-3">Crafted with love, served with pride</p>
          </div>

          {/* Loading skeleton */}
          {featured.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({length:6}).map((_,i) => (
                <div key={i} className="bg-warm-800 rounded-2xl overflow-hidden">
                  <div className="h-52 bg-warm-700 animate-pulse"/>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-warm-700 rounded w-3/4 animate-pulse"/>
                    <div className="h-3 bg-warm-700 rounded animate-pulse"/>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((item) => (
              <div key={item.id}
                className="group bg-warm-800 rounded-2xl overflow-hidden border border-warm-700/50 hover:border-cafe-500/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300">
                <div className="relative h-52 overflow-hidden">
                  {item.image_url
                    ? <img src={imgWithFallback(item.image_url, item.category_slug)} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e)=>{const t=e.target as HTMLImageElement;const fb=FALLBACK_IMAGES[item.category_slug];if(fb&&t.src!==fb)t.src=fb;}} />
                    : <div className="w-full h-full bg-warm-700 flex items-center justify-center text-6xl">{CATEGORY_EMOJI[item.category_slug]||'☕'}</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {item.is_vegetarian && <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">Veg</span>}
                    {item.tags?.includes('bestseller') && <span className="px-2 py-0.5 bg-cafe-500 text-white text-xs font-bold rounded-full">★ Best</span>}
                  </div>
                  <button onClick={() => handleAdd(item)}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-cafe-500 hover:bg-cafe-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 active:scale-90 shadow-lg">
                    <Plus className="w-5 h-5"/>
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-cafe-400 text-xs uppercase tracking-widest mb-1">{item.category_name}</p>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-white text-lg font-semibold leading-snug">{item.name}</h3>
                    <span className="text-cafe-400 font-bold text-lg ml-3 shrink-0">${parseFloat(item.price).toFixed(2)}</span>
                  </div>
                  <p className="text-warm-400 text-sm leading-relaxed line-clamp-2 mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-warm-500">
                      {parseFloat(item.avg_rating) > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"/>{parseFloat(item.avg_rating).toFixed(1)}</span>
                      )}
                      {item.prep_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{item.prep_time}m</span>}
                    </div>
                    <button onClick={() => handleAdd(item)} className="text-cafe-400 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors group/btn">
                      Add <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/menu" className="border-2 border-cafe-500 text-cafe-400 hover:bg-cafe-500 hover:text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-300 inline-flex items-center gap-2">
              View Full Menu <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STORY SECTION ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-cafe-500 font-semibold uppercase tracking-[4px] text-xs mb-4">Our Story</p>
            <h2 className="section-title mb-6">More Than Just<br/>a Coffee Shop</h2>
            <p className="text-warm-500 text-lg leading-relaxed mb-6">
              We believe coffee is more than a drink — it's a ritual, a pause, a connection. Every bean we source tells a story of the farmer who grew it.
            </p>
            <p className="text-warm-400 leading-relaxed mb-10">
              From our signature espresso blends to freshly baked pastries, everything is made in-house with ingredients we believe in.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                ['Single-Origin','Beans sourced directly from farms'],
                ['Made Fresh','Every item baked or brewed daily'],
                ['Cozy Space','600 sqft of warm, welcoming cafe'],
                ['Community','Events, music & good vibes'],
              ].map(([t,d]) => (
                <div key={t} className="flex gap-3">
                  <div className="w-1 rounded-full bg-cafe-400 shrink-0 mt-1"/>
                  <div>
                    <p className="font-semibold text-warm-800">{t}</p>
                    <p className="text-warm-400 text-sm mt-0.5">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image collage — use storyItems which are diverse */}
          <div className="grid grid-cols-2 gap-3" style={{height:'420px'}}>
            {storyItems.length > 0
              ? storyItems.map((item, i) => (
                  <div key={item.id}
                    className={`relative rounded-2xl overflow-hidden group ${i===1?'mt-8':''} ${i===3?'-mt-8':''}`}
                    style={{minHeight:'160px'}}>
                    <img src={item.image_url} alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <span className="text-white text-sm font-semibold">{item.name}</span>
                    </div>
                  </div>
                ))
              : Array.from({length:4}).map((_,i) => (
                  <div key={i} className={`rounded-2xl bg-warm-100 animate-pulse ${i===1?'mt-8':''} ${i===3?'-mt-8':''}`} style={{minHeight:'160px'}}/>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="bg-cafe-50 border-y border-cafe-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-cafe-500 font-semibold uppercase tracking-[4px] text-xs mb-4">Reviews</p>
            <h2 className="section-title">What Guests Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-warm-100 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {Array.from({length:t.rating}).map((_,j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400"/>)}
                </div>
                <p className="text-warm-600 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cafe-500 rounded-full flex items-center justify-center text-white font-bold">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-warm-800">{t.name}</p>
                    <p className="text-xs text-warm-400">Regular Guest</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AMENITIES ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {AMENITIES.map((a, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-white border border-warm-100 hover:-translate-y-1.5 hover:shadow-lg hover:border-cafe-200 transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 bg-cafe-50 rounded-2xl mx-auto mb-4">
                {a.icon}
              </div>
              <p className="font-display font-semibold text-warm-800 mb-1">{a.title}</p>
              <p className="text-warm-400 text-sm">{a.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-warm-900 py-28">
        {allItems.find(i => i.image_url) && (
          <div className="absolute inset-0">
            <img
              src={allItems.filter(i=>i.image_url)[10]?.image_url || allItems.find(i=>i.image_url)?.image_url}
              alt="cafe atmosphere"
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-warm-900 via-warm-900/95 to-warm-900/80"/>
          </div>
        )}
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <p className="text-cafe-400 font-semibold uppercase tracking-[4px] text-xs mb-4">Reservations</p>
          <h2 className="font-display text-5xl font-bold text-white mb-6">Reserve Your<br/>Perfect Table</h2>
          <p className="text-warm-300 text-lg font-light leading-relaxed mb-10">
            From a quiet solo morning to a special celebration — we'll have everything ready for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservations" className="btn-primary text-base py-4 px-10 inline-flex items-center gap-2 justify-center">
              Book a Table <ArrowRight className="w-4 h-4"/>
            </Link>
            <Link href="/menu" className="glass text-white font-semibold py-4 px-10 rounded-xl hover:bg-white/15 transition-all inline-flex items-center gap-2 justify-center border border-white/20">
              <Coffee className="w-4 h-4"/> View Menu
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

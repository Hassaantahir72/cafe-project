'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { menuAPI } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { Search, Leaf, Plus, Clock, Star, X, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const ItemModal = dynamic(() => import('@/components/ui/ItemModal'), { ssr: false });


const FALLBACK_IMAGES: Record<string, string> = {
  'hot-drinks':  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
  'cold-drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  'breakfast':   'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  'sandwiches':  'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  'pastries':    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  'salads':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};
const CATEGORY_EMOJI: Record<string, string> = {
  'hot-drinks': '☕', 'cold-drinks': '🧊', 'breakfast': '🌅',
  'sandwiches': '🥪', 'pastries': '🥐', 'salads': '🥗',
};

function MenuContent() {
  const searchParams = useSearchParams();
  const [items, setItems]               = useState<any[]>([]);
  const [categories, setCategories]     = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [search, setSearch]             = useState('');
  const [vegOnly, setVegOnly]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const cartItems  = useCartStore(s => s.items);
  const cartCount  = useCartStore(s => s.count());
  const cartTotal  = useCartStore(s => s.total());
  const addItem    = useCartStore(s => s.addItem);

  useEffect(() => {
    setLoading(true);
    Promise.all([menuAPI.getCategories(), menuAPI.getItems()])
      .then(([cats, its]) => { setCategories(cats.data); setItems(its.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item: any) => {
    const matchCat    = activeCategory === 'all' || item.category_slug === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    const matchVeg    = !vegOnly || item.is_vegetarian;
    return matchCat && matchSearch && matchVeg;
  });

  // Group by category for display
  const grouped = activeCategory === 'all'
    ? categories.map((cat: any) => ({
        ...cat,
        items: filtered.filter((i: any) => i.category_slug === cat.slug),
      })).filter(g => g.items.length > 0)
    : [{ name: categories.find(c => c.slug === activeCategory)?.name || '', slug: activeCategory, items: filtered }];

  const quickAdd = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    addItem({ id: item.id, name: item.name, price: parseFloat(item.price), image_url: item.image_url });
    toast.success(`${item.name} added!`);
  };

  const cartQtyForItem = (id: string) => cartItems.find(i => i.id === id)?.quantity || 0;

  return (
    <div className="min-h-screen bg-warm-50">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="bg-warm-900 relative overflow-hidden py-16">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #c4843a 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-cafe-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <p className="text-cafe-400 font-semibold uppercase tracking-[4px] text-xs mb-2">Our Menu</p>
          <h1 className="font-display text-5xl font-bold text-white mb-2">What's Brewing</h1>
          <p className="text-warm-400 text-base font-light">Fresh, seasonal, crafted with love every single day</p>
        </div>
      </div>

      {/* ── Sticky filter bar ────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-warm-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          {/* Search + veg toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-cafe-300 text-sm bg-warm-50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all shrink-0
                ${vegOnly ? 'bg-green-500 border-green-500 text-white' : 'border-warm-200 text-warm-500 bg-white hover:border-green-400'}`}>
              <Leaf className="w-4 h-4" />
              <span className="hidden sm:inline">Veg</span>
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all
                ${activeCategory === 'all' ? 'bg-cafe-500 text-white shadow-md shadow-cafe-500/25' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>
              All
            </button>
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.slug)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all
                  ${activeCategory === cat.slug ? 'bg-cafe-500 text-white shadow-md shadow-cafe-500/25' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}>
                <span>{CATEGORY_EMOJI[cat.slug] || '🍽️'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-warm-100">
                <div className="h-48 bg-warm-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-warm-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-warm-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">☕</div>
            <p className="text-xl font-display font-semibold text-warm-700 mb-2">Nothing found</p>
            <p className="text-warm-400 mb-6">Try a different search or filter</p>
            <button onClick={() => { setSearch(''); setActiveCategory('all'); setVegOnly(false); }}
              className="btn-outline text-sm">Clear Filters</button>
          </div>
        )}

        {/* Grouped sections */}
        {!loading && filtered.length > 0 && grouped.map((group: any) => (
          <div key={group.slug} className="mb-12">
            {/* Section header — only show when viewing all */}
            {activeCategory === 'all' && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{CATEGORY_EMOJI[group.slug] || '🍽️'}</span>
                <h2 className="font-display text-2xl font-bold text-warm-900">{group.name}</h2>
                <div className="flex-1 h-px bg-warm-200" />
                <span className="text-sm text-warm-400">{group.items.length} items</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map((item: any) => {
                const inCart = cartQtyForItem(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-2xl overflow-hidden border border-warm-100 hover:border-cafe-200 hover:shadow-lg hover:shadow-cafe-500/8 transition-all duration-300 cursor-pointer group active:scale-[0.98]">

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-warm-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-warm-100 to-cafe-50">
                          {CATEGORY_EMOJI[item.category_slug] || '🍽️'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                        {item.is_vegetarian && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                            <Leaf className="w-2.5 h-2.5" /> Veg
                          </span>
                        )}
                        {item.tags?.includes('popular') && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">🔥 Hot</span>
                        )}
                        {item.tags?.includes('bestseller') && (
                          <span className="px-2 py-0.5 bg-cafe-500 text-white text-xs font-bold rounded-full">★ Best</span>
                        )}
                      </div>

                      {/* Cart qty badge */}
                      {inCart > 0 && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-cafe-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                          {inCart}
                        </div>
                      )}

                      {/* Quick add — bottom right */}
                      <button
                        onClick={e => quickAdd(e, item)}
                        className="absolute bottom-2.5 right-2.5 w-10 h-10 bg-cafe-500 hover:bg-cafe-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 shadow-xl active:scale-90">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="font-display font-semibold text-warm-900 text-base leading-snug">{item.name}</h3>
                        <span className="text-cafe-600 font-bold text-base shrink-0">${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                      <p className="text-warm-400 text-sm leading-relaxed line-clamp-2 mb-3">{item.description}</p>

                      {/* Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-warm-400">
                          {parseFloat(item.avg_rating) > 0 && (
                            <span className="flex items-center gap-1 text-amber-500 font-medium">
                              <Star className="w-3 h-3 fill-current" />
                              {parseFloat(item.avg_rating).toFixed(1)}
                            </span>
                          )}
                          {item.prep_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.prep_time}m
                            </span>
                          )}
                        </div>
                        {/* Tap to view hint */}
                        <span className="text-xs text-warm-300 group-hover:text-cafe-400 transition-colors flex items-center gap-0.5">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Sticky Cart Bar (shows when cart has items) ───── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-warm-50 via-warm-50/95 to-transparent pt-8">
          <Link href="/checkout"
            className="flex items-center justify-between w-full max-w-lg mx-auto bg-warm-900 hover:bg-cafe-700 text-white rounded-2xl px-5 py-4 shadow-2xl transition-all duration-300 active:scale-[0.98] group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-cafe-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      )}

      {/* ── Item Detail Modal ─────────────────────────────── */}
      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">☕</div>
          <p className="text-warm-400 font-medium">Loading menu...</p>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Minus, Star, Clock, Leaf, Flame, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Props {
  item: any;
  onClose: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'hot-drinks': '☕', 'cold-drinks': '🧊', 'breakfast': '🌅',
  'sandwiches': '🥪', 'pastries': '🥐', 'salads': '🥗',
};

// Fallback images per category if Unsplash fails
const FALLBACK_IMAGES: Record<string, string> = {
  'hot-drinks':  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
  'cold-drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  'breakfast':   'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  'sandwiches':  'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  'pastries':    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  'salads':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

export default function ItemModal({ item, onClose }: Props) {
  const [qty, setQty]         = useState(1);
  const [notes, setNotes]     = useState('');
  const [imgSrc, setImgSrc]   = useState(item.image_url || FALLBACK_IMAGES[item.category_slug] || '');
  const [imgFailed, setImgFailed] = useState(false);
  const addItem   = useCartStore(s => s.addItem);
  const cartItems = useCartStore(s => s.items);
  const cartQty   = cartItems.find(i => i.id === item.id)?.quantity || 0;

  // Lock body scroll, close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleImgError = () => {
    // Try category fallback first, then show emoji
    const fallback = FALLBACK_IMAGES[item.category_slug];
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setImgFailed(true);
    }
  };

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        id:        item.id,
        name:      item.name,
        price:     parseFloat(item.price),
        image_url: imgSrc,
        notes:     notes.trim() || undefined,
      });
    }
    toast.success(
      <div className="flex items-center gap-2">
        <span>☕</span>
        <div>
          <p className="font-semibold text-sm">{qty}× {item.name} added!</p>
          <p className="text-xs opacity-70">View cart to checkout</p>
        </div>
      </div>,
      { duration: 2500 }
    );
    onClose();
  };

  const lineTotal = (parseFloat(item.price) * qty).toFixed(2);

  return (
    // Portal-like overlay — z-[200] to be above everything
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: 200 }}>

      {/* Backdrop — NO blur, just dark overlay */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        style={{ zIndex: 200 }}
      />

      {/* Modal panel */}
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ zIndex: 201, maxHeight: '92vh' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Hero image */}
        <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden bg-warm-100">
          {!imgFailed ? (
            <img
              src={imgSrc}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={handleImgError}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warm-100 to-cafe-50">
              <div className="text-center">
                <span className="text-7xl">{CATEGORY_EMOJI[item.category_slug] || '🍽️'}</span>
                <p className="text-warm-400 text-sm mt-2">{item.name}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
            {item.is_vegetarian && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                <Leaf className="w-3 h-3" /> Vegetarian
              </span>
            )}
            {item.tags?.includes('bestseller') && (
              <span className="px-2.5 py-1 bg-cafe-500 text-white text-xs font-bold rounded-full">★ Bestseller</span>
            )}
            {item.tags?.includes('popular') && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                <Flame className="w-3 h-3" /> Popular
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <p className="text-cafe-500 text-xs uppercase tracking-widest font-semibold mb-1">{item.category_name}</p>
              <h2 className="font-display text-2xl font-bold text-warm-900 leading-tight">{item.name}</h2>
            </div>
            <span className="text-2xl font-bold text-cafe-600 shrink-0 mt-1">
              ${parseFloat(item.price).toFixed(2)}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-warm-400 mb-4">
            {parseFloat(item.avg_rating) > 0 && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-current" />
                {parseFloat(item.avg_rating).toFixed(1)}
                <span className="text-warm-400 font-normal text-xs">({item.review_count} reviews)</span>
              </span>
            )}
            {item.prep_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {item.prep_time} min
              </span>
            )}
            {item.calories && (
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4" /> {item.calories} cal
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-warm-500 leading-relaxed mb-5">{item.description}</p>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {item.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-warm-100 text-warm-600 text-xs font-medium rounded-full capitalize">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Already in cart */}
          {cartQty > 0 && (
            <div className="flex items-center gap-2 bg-cafe-50 border border-cafe-200 rounded-xl px-4 py-3 mb-4">
              <ShoppingBag className="w-4 h-4 text-cafe-500 shrink-0" />
              <p className="text-cafe-700 text-sm font-medium">
                {cartQty}× already in your cart
              </p>
            </div>
          )}

          {/* Special instructions */}
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-2">
              Special Instructions
              <span className="text-warm-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Extra hot, oat milk, no sugar, extra shot..."
              rows={2}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-cafe-300 text-sm bg-warm-50 text-warm-800 placeholder-warm-300 resize-none"
            />
            {notes && (
              <p className="text-xs text-warm-300 text-right mt-1">{notes.length}/200</p>
            )}
          </div>
        </div>

        {/* Footer: qty + add */}
        <div
          className="shrink-0 p-4 pt-3 border-t border-warm-100 bg-white"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3">
            {/* Qty */}
            <div className="flex items-center bg-warm-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-9 h-9 rounded-lg bg-white hover:bg-cafe-50 flex items-center justify-center text-warm-700 disabled:opacity-30 transition-colors shadow-sm active:scale-90">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-bold text-warm-900 text-lg select-none">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(20, q + 1))}
                className="w-9 h-9 rounded-lg bg-white hover:bg-cafe-50 flex items-center justify-center text-warm-700 transition-colors shadow-sm active:scale-90">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              className="flex-1 btn-primary py-3.5 flex items-center justify-between px-5 text-base">
              <span className="font-semibold">Add to Order</span>
              <span className="font-bold">${lineTotal}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

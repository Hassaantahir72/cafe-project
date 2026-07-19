'use client';
import { useCartStore } from '@/lib/store';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';

interface Props { open: boolean; onClose: () => void; }

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore();
  const tax      = total() * 0.08;
  const grandTotal = total() + tax;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col
        ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-warm-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cafe-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-cafe-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-warm-900 text-lg">Your Order</h2>
              <p className="text-xs text-warm-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-warm-100 transition-colors">
              <X className="w-5 h-5 text-warm-500" />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
            <div className="w-24 h-24 bg-warm-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-warm-300" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-warm-700 text-xl mb-1">Your cart is empty</p>
              <p className="text-warm-400 text-sm">Add items from our menu to get started</p>
            </div>
            <button onClick={onClose}
              className="btn-primary px-8 py-3">
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {items.map(item => (
                <div key={item.id} className="flex gap-3 bg-warm-50 rounded-2xl p-3 border border-warm-100 hover:border-cafe-200 transition-colors group">
                  {/* Image */}
                  {item.image_url && (
                    <div className="w-18 h-18 rounded-xl overflow-hidden shrink-0 bg-warm-200" style={{ width: '72px', height: '72px' }}>
                      <img src={item.image_url} alt={item.name}
                        className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-warm-900 text-sm truncate">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-warm-400 mt-0.5 flex items-center gap-1 truncate">
                        <Tag className="w-3 h-3 shrink-0" /> {item.notes}
                      </p>
                    )}
                    <p className="text-cafe-600 font-bold mt-1">${(item.price * item.quantity).toFixed(2)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-white rounded-xl border border-warm-200 p-0.5">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg hover:bg-warm-100 flex items-center justify-center text-warm-600 transition-colors active:scale-90">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-warm-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg hover:bg-warm-100 flex items-center justify-center text-warm-600 transition-colors active:scale-90">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-warm-400">${item.price.toFixed(2)} each</span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-warm-300 hover:text-red-500 transition-colors self-start opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order summary + checkout */}
            <div className="border-t border-warm-100 px-5 py-5 space-y-4 shrink-0 bg-white">
              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-warm-500">
                  <span>Subtotal</span>
                  <span>${total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-warm-500">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-warm-900 text-base pt-2 border-t border-warm-100">
                  <span>Total</span>
                  <span className="text-cafe-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <Link href="/checkout" onClick={onClose}
                className="btn-primary w-full flex items-center justify-between px-5 py-4 text-base group">
                <span className="font-semibold">Proceed to Checkout</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">${grandTotal.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <p className="text-xs text-warm-300 text-center">
                Free pickup · Delivery within 5km · Cash or card
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

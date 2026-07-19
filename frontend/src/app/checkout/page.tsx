'use client';
import { useState, useRef } from 'react';
import { useCartStore, useAuthStore } from '@/lib/store';
import { ordersAPI } from '@/lib/api';
import {
  ShoppingBag, CheckCircle, ArrowLeft, Utensils, Package, Truck,
  Minus, Plus, Trash2, CreditCard, Banknote, Building2,
  Upload, X, Eye, EyeOff, Lock, CheckCheck, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const ORDER_TYPES = [
  { value: 'dine_in',  label: 'Dine In',  icon: Utensils, desc: 'Eat at the cafe' },
  { value: 'takeaway', label: 'Takeaway',  icon: Package,  desc: 'Pick up your order' },
  { value: 'delivery', label: 'Delivery',  icon: Truck,    desc: 'Delivered to you' },
];

// Bank account details (edit these to your real account)
const BANK_DETAILS = {
  bankName:      'Habib Bank Limited (HBL)',
  accountTitle:  'Brewed Awakening Cafe',
  accountNumber: '1234-5678-9012-3456',
  iban:          'PK36HABB0000001234567890',
  branchCode:    '0123',
  swift:         'HABBPKKA',
};

// Card input formatter
function formatCardNumber(v: string) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g,'').slice(0,4);
  if (digits.length >= 3) return digits.slice(0,2) + '/' + digits.slice(2);
  return digits;
}

export default function CheckoutPage() {
  const { items, total, clearCart, updateQty, removeItem } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading]   = useState(false);
  const [order, setOrder]       = useState<any>(null);
  const [showCvv, setShowCvv]   = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    customer_name:        user?.name  || '',
    customer_email:       user?.email || '',
    customer_phone:       user?.phone || '',
    type:                 'dine_in',
    delivery_address:     '',
    special_instructions: '',
    payment_method:       'cash',
    // Card fields
    card_number:    '',
    card_name:      '',
    card_expiry:    '',
    card_cvv:       '',
    // Bank transfer fields
    transfer_reference: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const tax        = total() * 0.08;
  const grandTotal = total() + tax;

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return toast.error('Your cart is empty');
    if (!form.customer_name || !form.customer_email || !form.customer_phone)
      return toast.error('Please fill in all contact details');
    if (form.type === 'delivery' && !form.delivery_address)
      return toast.error('Please enter a delivery address');
    if (form.payment_method === 'card') {
      if (!form.card_number || form.card_number.replace(/\s/g,'').length < 16)
        return toast.error('Please enter a valid card number');
      if (!form.card_name) return toast.error('Please enter the cardholder name');
      if (!form.card_expiry || form.card_expiry.length < 5)
        return toast.error('Please enter card expiry date');
      if (!form.card_cvv || form.card_cvv.length < 3)
        return toast.error('Please enter CVV');
    }
    if (form.payment_method === 'bank_transfer' && !form.transfer_reference)
      return toast.error('Please enter your transfer reference number');

    setLoading(true);
    try {
      const { data } = await ordersAPI.place({
        customer_name:        form.customer_name,
        customer_email:       form.customer_email,
        customer_phone:       form.customer_phone,
        type:                 form.type,
        delivery_address:     form.delivery_address,
        special_instructions: form.special_instructions,
        payment_method:       form.payment_method,
        items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity, notes: i.notes })),
      });
      setOrder(data.order);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────
  if (order) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-900 mb-2">Order Placed!</h1>
          <p className="text-warm-400 mb-8">Your order is being prepared with love ☕</p>
          <div className="bg-white rounded-2xl border border-warm-100 p-6 text-left mb-6 space-y-3">
            <div className="text-center pb-4 border-b border-warm-100">
              <p className="text-xs text-warm-400 uppercase tracking-widest mb-1">Order Number</p>
              <p className="font-display text-2xl font-bold text-cafe-600">{order.order_number}</p>
            </div>
            {[
              ['Type',    order.type?.replace('_',' ')],
              ['Payment', order.payment_method?.replace('_',' ')],
              ['Status',  order.status],
              ['Total',   `$${parseFloat(order.total).toFixed(2)}`],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-warm-400">{k}</span>
                <span className="font-semibold text-warm-800 capitalize">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/order-tracking" className="flex-1 btn-primary text-center py-3.5">Track Order</Link>
            <Link href="/menu" className="flex-1 btn-outline text-center py-3.5">Order More</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────
  if (!items.length) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-warm-300" />
          </div>
          <h1 className="font-display text-2xl font-bold text-warm-900 mb-2">Your cart is empty</h1>
          <p className="text-warm-400 mb-6">Add some items from our menu first</p>
          <Link href="/menu" className="btn-primary inline-block px-8 py-3">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <div className="bg-white border-b border-warm-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/menu" className="p-2 rounded-xl hover:bg-warm-100 transition-colors text-warm-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display font-bold text-warm-900 text-xl">Checkout</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-warm-400">
            <Lock className="w-3.5 h-3.5 text-green-500" />
            <span>Secure checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-8">

            {/* ── Left: Form ─────────────────────────── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Contact */}
              <div className="bg-white rounded-2xl border border-warm-100 p-6 space-y-4">
                <h2 className="font-display font-bold text-warm-900 text-lg">Contact Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                      className="input" placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)}
                      className="input" placeholder="+92 300 1234567" required />
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
                    className="input" placeholder="you@example.com" required />
                </div>
              </div>

              {/* Order type */}
              <div className="bg-white rounded-2xl border border-warm-100 p-6 space-y-4">
                <h2 className="font-display font-bold text-warm-900 text-lg">Order Type</h2>
                <div className="grid grid-cols-3 gap-3">
                  {ORDER_TYPES.map(t => {
                    const Icon = t.icon;
                    const active = form.type === t.value;
                    return (
                      <button type="button" key={t.value} onClick={() => set('type', t.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                          active ? 'border-cafe-500 bg-cafe-50' : 'border-warm-200 hover:border-warm-300 bg-white'}`}>
                        <Icon className={`w-5 h-5 mx-auto mb-1.5 ${active ? 'text-cafe-500' : 'text-warm-400'}`} />
                        <p className={`text-sm font-semibold ${active ? 'text-cafe-700' : 'text-warm-600'}`}>{t.label}</p>
                        <p className="text-xs text-warm-400 mt-0.5 hidden sm:block">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {form.type === 'delivery' && (
                  <div>
                    <label className="label">Delivery Address *</label>
                    <textarea value={form.delivery_address} onChange={e => set('delivery_address', e.target.value)}
                      className="input resize-none" rows={2}
                      placeholder="Street address, area, city..." required />
                  </div>
                )}
              </div>

              {/* ── PAYMENT METHOD ─────────────────────── */}
              <div className="bg-white rounded-2xl border border-warm-100 p-6 space-y-5">
                <h2 className="font-display font-bold text-warm-900 text-lg">Payment Method</h2>

                {/* Method selector */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'cash',          label: 'Cash',          icon: <Banknote className="w-5 h-5"/>   },
                    { value: 'card',          label: 'Card',          icon: <CreditCard className="w-5 h-5"/> },
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 className="w-5 h-5"/> },
                  ].map(p => {
                    const active = form.payment_method === p.value;
                    return (
                      <button type="button" key={p.value} onClick={() => set('payment_method', p.value)}
                        className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                          active ? 'border-cafe-500 bg-cafe-50' : 'border-warm-200 hover:border-warm-300 bg-white'}`}>
                        <span className={active ? 'text-cafe-500' : 'text-warm-400'}>{p.icon}</span>
                        <span className={`text-xs font-semibold ${active ? 'text-cafe-700' : 'text-warm-600'}`}>{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ── CASH ──────────────────────────────── */}
                {form.payment_method === 'cash' && (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <Banknote className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">Pay with Cash</p>
                      <p className="text-green-700 text-xs mt-0.5 leading-relaxed">
                        Pay in cash when your order is ready for pickup or upon delivery. Please have the exact amount ready.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── CARD ──────────────────────────────── */}
                {form.payment_method === 'card' && (
                  <div className="space-y-4">
                    {/* Visual card preview */}
                    <div className="relative h-44 bg-gradient-to-br from-warm-800 via-warm-900 to-cafe-900 rounded-2xl p-5 overflow-hidden shadow-xl">
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-10"
                        style={{backgroundImage:'radial-gradient(circle at 80% 20%, #c4843a 0%, transparent 50%)',}} />
                      <div className="absolute top-4 right-5">
                        <div className="flex gap-1">
                          <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-90" />
                          <div className="w-8 h-8 bg-orange-500 rounded-full opacity-80 -ml-3" />
                        </div>
                      </div>
                      {/* Chip */}
                      <div className="w-10 h-7 bg-yellow-300/80 rounded-md mb-4" />
                      {/* Card number */}
                      <p className="text-white font-mono text-lg tracking-[4px] mb-3">
                        {form.card_number
                          ? form.card_number.padEnd(19, '·').replace(/(.{5})/g, '$1')
                          : '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-white/50 text-xs uppercase tracking-widest">Card Holder</p>
                          <p className="text-white font-medium text-sm mt-0.5 uppercase tracking-wide">
                            {form.card_name || 'YOUR NAME'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/50 text-xs uppercase tracking-widest">Expires</p>
                          <p className="text-white font-medium text-sm mt-0.5">
                            {form.card_expiry || 'MM/YY'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card inputs */}
                    <div>
                      <label className="label">Card Number *</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                        <input
                          value={form.card_number}
                          onChange={e => set('card_number', formatCardNumber(e.target.value))}
                          className="input pl-10 font-mono tracking-widest"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Cardholder Name *</label>
                      <input
                        value={form.card_name}
                        onChange={e => set('card_name', e.target.value.toUpperCase())}
                        className="input uppercase tracking-wide"
                        placeholder="AS ON YOUR CARD"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Expiry Date *</label>
                        <input
                          value={form.card_expiry}
                          onChange={e => set('card_expiry', formatExpiry(e.target.value))}
                          className="input font-mono"
                          placeholder="MM/YY"
                          maxLength={5}
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="label">CVV *</label>
                        <div className="relative">
                          <input
                            type={showCvv ? 'text' : 'password'}
                            value={form.card_cvv}
                            onChange={e => set('card_cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                            className="input pr-10 font-mono tracking-widest"
                            placeholder="•••"
                            maxLength={4}
                            inputMode="numeric"
                          />
                          <button type="button" onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-600">
                            {showCvv ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-warm-400 bg-warm-50 rounded-xl p-3">
                      <Lock className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      Your card details are encrypted and secure. We do not store card information.
                    </div>
                  </div>
                )}

                {/* ── BANK TRANSFER ──────────────────────── */}
                {form.payment_method === 'bank_transfer' && (
                  <div className="space-y-4">
                    {/* Bank account details card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <p className="font-bold text-blue-800">Bank Account Details</p>
                      </div>
                      <p className="text-xs text-blue-600 mb-3">Transfer the exact amount to the account below, then upload your payment screenshot.</p>

                      {[
                        ['Bank Name',       BANK_DETAILS.bankName],
                        ['Account Title',   BANK_DETAILS.accountTitle],
                        ['Account Number',  BANK_DETAILS.accountNumber],
                        ['IBAN',            BANK_DETAILS.iban],
                        ['Branch Code',     BANK_DETAILS.branchCode],
                        ['SWIFT / BIC',     BANK_DETAILS.swift],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-0">
                          <span className="text-blue-600 text-sm font-medium">{label}</span>
                          <span className="font-bold text-blue-900 text-sm font-mono">{value}</span>
                        </div>
                      ))}

                      {/* Amount to transfer */}
                      <div className="mt-3 bg-blue-100 rounded-xl p-3 text-center">
                        <p className="text-xs text-blue-600 mb-1">Amount to Transfer</p>
                        <p className="font-display text-2xl font-bold text-blue-900">${grandTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Reference number */}
                    <div>
                      <label className="label">Transaction Reference / TID Number *</label>
                      <input
                        value={form.transfer_reference}
                        onChange={e => set('transfer_reference', e.target.value)}
                        className="input font-mono"
                        placeholder="e.g. TXN123456789"
                        required={form.payment_method === 'bank_transfer'}
                      />
                      <p className="text-xs text-warm-400 mt-1">
                        Enter the transaction ID or reference number from your bank transfer confirmation.
                      </p>
                    </div>

                    {/* Screenshot upload */}
                    <div>
                      <label className="label">Payment Screenshot *</label>
                      {!screenshotPreview ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-warm-200 hover:border-cafe-400 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors bg-warm-50 hover:bg-cafe-50 group">
                          <div className="w-12 h-12 bg-warm-200 group-hover:bg-cafe-100 rounded-full flex items-center justify-center transition-colors">
                            <Upload className="w-6 h-6 text-warm-400 group-hover:text-cafe-500" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-warm-600 group-hover:text-cafe-600 text-sm">
                              Click to upload screenshot
                            </p>
                            <p className="text-xs text-warm-400 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        </button>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border-2 border-cafe-300">
                          <img src={screenshotPreview} alt="Payment screenshot"
                            className="w-full max-h-64 object-contain bg-warm-100" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                              className="p-2 bg-white/90 hover:bg-white rounded-lg shadow text-warm-600 transition-colors">
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={removeScreenshot}
                              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg shadow text-white transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-green-500/90 text-white text-xs py-2 px-3 flex items-center gap-1.5">
                            <CheckCheck className="w-3.5 h-3.5" /> Screenshot uploaded — {screenshot?.name}
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshot}
                        className="hidden"
                      />
                    </div>

                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <span className="text-amber-500 text-sm shrink-0 mt-0.5">⚠️</span>
                      <p className="text-amber-700 text-xs leading-relaxed">
                        Your order will be confirmed after we verify the payment. This usually takes 5–15 minutes during business hours.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Special instructions */}
              <div className="bg-white rounded-2xl border border-warm-100 p-6">
                <label className="label">Special Instructions <span className="text-warm-400 font-normal">(optional)</span></label>
                <textarea value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)}
                  className="input resize-none" rows={3}
                  placeholder="Allergies, special requests, table preferences..." />
              </div>
            </div>

            {/* ── Right: Order Summary ─────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden sticky top-24">
                <div className="p-5 border-b border-warm-100">
                  <h2 className="font-display font-bold text-warm-900 text-lg">Order Summary</h2>
                  <p className="text-sm text-warm-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Items */}
                <div className="divide-y divide-warm-50 max-h-72 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 p-4 hover:bg-warm-50 group transition-colors">
                      {item.image_url && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-warm-100">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-warm-800 text-sm truncate">{item.name}</p>
                        {item.notes && <p className="text-xs text-warm-400 truncate">{item.notes}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1 bg-warm-100 rounded-lg p-0.5">
                            <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center transition-colors">
                              <Minus className="w-3 h-3 text-warm-600" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-warm-800">{item.quantity}</span>
                            <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center transition-colors">
                              <Plus className="w-3 h-3 text-warm-600" />
                            </button>
                          </div>
                          <button type="button" onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="font-bold text-warm-800 text-sm shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="p-5 border-t border-warm-100 space-y-3">
                  <div className="flex justify-between text-sm text-warm-500"><span>Subtotal</span><span>${total().toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-warm-500"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                  {form.type === 'delivery' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Delivery</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-warm-900 text-lg pt-2 border-t border-warm-100">
                    <span>Total</span>
                    <span className="text-cafe-600">${grandTotal.toFixed(2)}</span>
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 mt-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <><Lock className="w-4 h-4" /> Place Order · ${grandTotal.toFixed(2)}</>
                    )}
                  </button>
                  <p className="text-xs text-warm-400 text-center pt-1">
                    🔒 Secure & encrypted checkout
                  </p>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

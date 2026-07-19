'use client';
import { useState, useEffect } from 'react';
import { ordersAPI } from '@/lib/api';
import { Search, Package, CheckCircle, Clock, ChefHat, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const STATUSES = [
  { key: 'pending', label: 'Order Received', icon: Package, color: 'text-yellow-500' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-500' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-orange-500' },
  { key: 'ready', label: 'Ready', icon: CheckCircle, color: 'text-green-500' },
  { key: 'delivered', label: 'Delivered', icon: Truck, color: 'text-green-600' },
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await ordersAPI.track(orderNumber.trim().toUpperCase());
      setOrder(data);
    } catch {
      toast.error('Order not found. Check your order number.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!order) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_order', order.id);
    socket.on('order_update', ({ status }: any) => {
      setOrder((prev: any) => ({ ...prev, status }));
      toast.success(`Order status updated: ${status.replace('_', ' ').toUpperCase()}`);
    });
    return () => { socket.disconnect(); };
  }, [order?.id]);

  const currentStep = STATUSES.findIndex(s => s.key === order?.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <div className="mb-10">
        <p className="text-cafe-500 font-medium uppercase tracking-widest text-sm mb-2">Track</p>
        <h1 className="section-title">Order Tracking</h1>
        <p className="section-sub">Real-time updates on your order</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-3 mb-10">
        <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Enter order number (e.g. ORD12345678)"
          className="input flex-1" required />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-5">
          <Search className="w-4 h-4" /> {loading ? '...' : 'Track'}
        </button>
      </form>

      {order && (
        <div className="animate-slide-up">
          <div className="card p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-warm-400 uppercase tracking-wide">Order Number</p>
                <p className="text-xl font-bold text-warm-900">{order.order_number}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                'bg-cafe-100 text-cafe-700'}`}>
                {order.status?.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm text-warm-500 space-y-1">
              <p>Type: {order.type?.replace('_', ' ')}</p>
              <p>Total: <span className="font-semibold text-warm-800">${parseFloat(order.total).toFixed(2)}</span></p>
              <p>Ordered: {new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Progress stepper */}
          {order.status !== 'cancelled' && (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-warm-800 mb-6">Order Progress</h3>
              <div className="relative">
                {/* Progress bar */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-warm-100" />
                <div className="absolute left-5 top-5 w-0.5 bg-cafe-400 transition-all duration-1000"
                  style={{ height: `${(currentStep / (STATUSES.length - 1)) * 100}%` }} />
                <div className="space-y-6 relative">
                  {STATUSES.map((s, i) => {
                    const done = i <= currentStep;
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="flex items-center gap-4 relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-cafe-500 border-cafe-500' : 'bg-white border-warm-200'}`}>
                          <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-warm-300'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${done ? 'text-warm-900' : 'text-warm-400'}`}>{s.label}</p>
                          {i === currentStep && <p className="text-xs text-cafe-500 mt-0.5">Current status</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-warm-800 mb-4">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.filter((i:any) => i.name).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-warm-700">{item.name} × {item.qty}</span>
                    {item.price && <span className="text-warm-500">${(item.price * item.qty).toFixed(2)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

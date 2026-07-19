'use client';
import { useEffect, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const STATUSES = ['pending','confirmed','preparing','ready','delivered','cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    ordersAPI.getAll(filter ? { status: filter } : {})
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  // Real-time updates
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_admin');
    socket.on('new_order', ({ order }: any) => {
      setOrders(prev => [order, ...prev]);
      toast.success(`New order: ${order.order_number}`);
    });
    socket.on('order_updated', (order: any) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    });
    return () => { socket.disconnect(); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await ordersAPI.updateStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!filter ? 'bg-cafe-500 text-white' : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'}`}>All</button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter===s ? 'bg-cafe-500 text-white' : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'}`}>{s}</button>
          ))}
        </div>
        <button onClick={load} className="ml-auto p-2 rounded-xl bg-white border border-warm-200 hover:bg-warm-50 transition-colors">
          <RefreshCw className={`w-4 h-4 text-warm-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-warm-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                {['Order #', 'Customer', 'Type', 'Items', 'Total', 'Time', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({length: 8}).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-warm-100 rounded w-full" /></td>)}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-warm-400">No orders found</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-warm-900 text-sm">{order.order_number}</td>
                  <td className="px-4 py-4 text-sm text-warm-700">{order.customer_name || 'Guest'}<br/><span className="text-xs text-warm-400">{order.customer_email}</span></td>
                  <td className="px-4 py-4 text-sm text-warm-600 capitalize">{order.type?.replace('_',' ')}</td>
                  <td className="px-4 py-4 text-sm text-warm-600 max-w-[180px]">
                    <span className="line-clamp-2">{order.items?.filter((i:any)=>i.name).map((i:any)=>`${i.name}×${i.qty}`).join(', ') || '—'}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-warm-900">${parseFloat(order.total).toFixed(2)}</td>
                  <td className="px-4 py-4 text-xs text-warm-400">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-warm-100 text-warm-600'}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                      disabled={updating === order.id || order.status === 'delivered' || order.status === 'cancelled'}
                      className="text-xs border border-warm-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cafe-300 disabled:opacity-50 bg-white">
                      {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

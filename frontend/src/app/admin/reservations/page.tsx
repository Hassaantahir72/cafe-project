'use client';
import { useEffect, useState } from 'react';
import { reservationsAPI } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  no_show: 'bg-gray-100 text-gray-600',
};
const STATUSES = ['pending','confirmed','cancelled','completed','no_show'];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params: any = {};
    if (filter) params.status = filter;
    if (date) params.date = date;
    reservationsAPI.getAll(params)
      .then(r => setReservations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, date]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await reservationsAPI.updateStatus(id, status);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input max-w-[180px] text-sm py-2" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl text-sm font-medium ${!filter ? 'bg-cafe-500 text-white' : 'bg-white border border-warm-200 text-warm-600'}`}>All</button>
          {STATUSES.map((s: any) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${filter===s ? 'bg-cafe-500 text-white' : 'bg-white border border-warm-200 text-warm-600'}`}>{s.replace('_',' ')}</button>
          ))}
        </div>
        <button onClick={load} className="ml-auto p-2 rounded-xl bg-white border border-warm-200 hover:bg-warm-50">
          <RefreshCw className={`w-4 h-4 text-warm-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-warm-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                {['Code', 'Guest', 'Contact', 'Date & Time', 'Guests', 'Table', 'Requests', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({length: 9}).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-warm-100 rounded" /></td>)}
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-warm-400">No reservations found</td></tr>
              ) : reservations.map((res: any) => (
                <tr key={res.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-4 font-mono text-xs font-bold text-cafe-600">{res.confirmation_code}</td>
                  <td className="px-4 py-4 text-sm font-medium text-warm-800">{res.customer_name}</td>
                  <td className="px-4 py-4 text-xs text-warm-500">{res.customer_email}<br/>{res.customer_phone}</td>
                  <td className="px-4 py-4 text-sm text-warm-700 whitespace-nowrap">{res.reservation_date}<br/><span className="text-xs text-warm-400">{res.reservation_time?.slice(0,5)}</span></td>
                  <td className="px-4 py-4 text-sm text-warm-700">{res.guests}</td>
                  <td className="px-4 py-4 text-sm text-warm-600">{res.table_number || '—'}<br/><span className="text-xs text-warm-400">{res.location}</span></td>
                  <td className="px-4 py-4 text-xs text-warm-500 max-w-[150px]"><span className="line-clamp-2">{res.special_requests || '—'}</span></td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[res.status] || 'bg-warm-100 text-warm-600'}`}>{res.status?.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-4">
                    <select value={res.status} onChange={e => updateStatus(res.id, e.target.value)}
                      disabled={updating === res.id}
                      className="text-xs border border-warm-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cafe-300 disabled:opacity-50 bg-white">
                      {STATUSES.map((s: any) => <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>)}
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

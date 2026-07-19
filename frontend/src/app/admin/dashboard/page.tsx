'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { ShoppingBag, CalendarDays, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({length: 8}).map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-warm-100" />)}
    </div>
  );

  const statCards = [
    { label: 'Total Orders', value: stats?.orders?.total || 0, sub: `${stats?.orders?.today || 0} today`, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders', value: stats?.orders?.pending || 0, sub: 'Need attention', icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: "Today's Revenue", value: `$${parseFloat(stats?.revenue?.today || 0).toFixed(2)}`, sub: `$${parseFloat(stats?.revenue?.this_month || 0).toFixed(2)} this month`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Total Revenue', value: `$${parseFloat(stats?.revenue?.total || 0).toFixed(2)}`, sub: 'All time', icon: TrendingUp, color: 'bg-cafe-50 text-cafe-600' },
    { label: 'Reservations', value: stats?.reservations?.total || 0, sub: `${stats?.reservations?.today || 0} today`, icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Reservations', value: stats?.reservations?.pending || 0, sub: 'Awaiting confirmation', icon: CalendarDays, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Customers', value: stats?.customers?.total || 0, sub: `${stats?.customers?.today || 0} new today`, icon: Users, color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-warm-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-warm-500 font-medium">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-warm-900 mb-1">{card.value}</p>
              <p className="text-xs text-warm-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      {stats?.dailyRevenue?.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-100 p-6">
          <h2 className="font-semibold text-warm-800 mb-6">Revenue (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#938d7c' }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#938d7c' }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: any) => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#c4843a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top items */}
        <div className="bg-white rounded-xl border border-warm-100 p-6">
          <h2 className="font-semibold text-warm-800 mb-4">Top Selling Items</h2>
          <div className="space-y-3">
            {stats?.topItems?.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-cafe-100 text-cafe-600 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm font-medium text-warm-800">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-warm-800">{item.ordered} orders</p>
                  <p className="text-xs text-warm-400">${parseFloat(item.revenue).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-warm-100 p-6">
          <h2 className="font-semibold text-warm-800 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {stats?.recentOrders?.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-warm-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-warm-800">{order.order_number}</p>
                  <p className="text-xs text-warm-400">{order.customer_name || 'Guest'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${parseFloat(order.total).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    'bg-warm-100 text-warm-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

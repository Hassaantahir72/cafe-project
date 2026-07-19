'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Search, RefreshCw, Shield, AlertTriangle, User, Settings, ShoppingBag } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  EMAIL_VERIFIED: 'bg-blue-100 text-blue-700',
  PASSWORD_RESET: 'bg-yellow-100 text-yellow-700',
  PASSWORD_RESET_REQUESTED: 'bg-yellow-50 text-yellow-600',
  STAFF_CREATED: 'bg-purple-100 text-purple-700',
  STAFF_DELETED: 'bg-red-100 text-red-700',
  STAFF_UPDATED: 'bg-indigo-100 text-indigo-700',
  UNAUTHORIZED_ADMIN_ACCESS: 'bg-red-200 text-red-800',
  SQL_INJECTION_ATTEMPT: 'bg-red-300 text-red-900',
  INVALID_ADMIN_KEY: 'bg-red-200 text-red-800',
  SESSION_FORCE_REVOKED: 'bg-orange-100 text-orange-700',
  ALL_SESSIONS_REVOKED: 'bg-orange-100 text-orange-700',
  PROFILE_UPDATED: 'bg-cyan-100 text-cyan-700',
  TABLE_CREATED: 'bg-teal-100 text-teal-700',
  TABLE_DELETED: 'bg-red-100 text-red-700',
};

const SECURITY_EVENTS = ['UNAUTHORIZED_ADMIN_ACCESS','SQL_INJECTION_ATTEMPT','INVALID_ADMIN_KEY','BRUTE_FORCE'];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    adminAPI.getAuditLogs({ page, action: actionFilter, user_email: search })
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, actionFilter]);

  const securityCount = logs.filter(l => SECURITY_EVENTS.includes(l.action)).length;

  return (
    <div className="space-y-5">
      {/* Security alert banner */}
      {securityCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            {securityCount} security event{securityCount > 1 ? 's' : ''} detected in current view. Review immediately.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter'&&load()}
            placeholder="Search by email..." className="input pl-10 text-sm py-2" />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="input max-w-[200px] text-sm py-2">
          <option value="">All actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="PASSWORD_RESET">Password Reset</option>
          <option value="STAFF">Staff Actions</option>
          <option value="UNAUTHORIZED">Security Events</option>
          <option value="SQL_INJECTION">SQL Injection</option>
          <option value="SESSION">Session Events</option>
        </select>
        <button onClick={load} className="p-2 rounded-xl bg-white border border-warm-200 hover:bg-warm-50 transition-colors">
          <RefreshCw className={`w-4 h-4 text-warm-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="ml-auto text-sm text-warm-400 self-center">{total} total logs</div>
      </div>

      <div className="bg-white rounded-xl border border-warm-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>{['Time', 'Action', 'User', 'IP Address', 'Resource', 'Details'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {loading ? Array.from({length: 8}).map((_,i) => (
                <tr key={i} className="animate-pulse">{Array.from({length:6}).map((_,j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-100 rounded"/></td>
                ))}</tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-warm-400">No logs found</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className={`hover:bg-warm-50 transition-colors ${SECURITY_EVENTS.includes(log.action) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 text-xs text-warm-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-warm-100 text-warm-600'}`}>
                      {SECURITY_EVENTS.includes(log.action) && '⚠️ '}
                      {log.action.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-warm-800">{log.user_name || 'System'}</p>
                    <p className="text-xs text-warm-400">{log.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-warm-600">{log.ip_address || '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-500">{log.resource || '—'} {log.resource_id ? `· ${log.resource_id.slice(0,8)}...` : ''}</td>
                  <td className="px-4 py-3 text-xs text-warm-500 max-w-[200px]">
                    {log.details ? <span className="font-mono bg-warm-100 px-1.5 py-0.5 rounded text-xs">{JSON.stringify(log.details).slice(0, 60)}</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-warm-100">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              className="px-4 py-1.5 text-sm rounded-lg border border-warm-200 disabled:opacity-40 hover:bg-warm-50">Previous</button>
            <span className="text-sm text-warm-500">Page {page} of {Math.ceil(total/50)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={page*50>=total}
              className="px-4 py-1.5 text-sm rounded-lg border border-warm-200 disabled:opacity-40 hover:bg-warm-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

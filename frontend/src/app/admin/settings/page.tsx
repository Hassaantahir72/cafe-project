'use client';
import { useEffect, useState } from 'react';
import { settingsAPI } from '@/lib/api';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setSettings((s: any) => ({ ...s, [k]: v }));

  useEffect(() => {
    settingsAPI.get().then(r => setSettings(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({length: 8}).map((_,i) => <div key={i} className="h-14 bg-white rounded-xl border border-warm-100"/>)}</div>;

  const fields = [
    { key: 'cafe_name', label: 'Cafe Name', type: 'text' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'phone', label: 'Phone Number', type: 'text' },
    { key: 'email', label: 'Contact Email', type: 'email' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'instagram', label: 'Instagram Handle', type: 'text' },
    { key: 'facebook', label: 'Facebook Page', type: 'text' },
    { key: 'loyalty_points_per_dollar', label: 'Loyalty Points Per Dollar', type: 'number' },
    { key: 'tax_rate', label: 'Tax Rate (e.g. 0.08 = 8%)', type: 'number' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-warm-100 p-6 space-y-5">
        <h2 className="font-semibold text-warm-800 text-lg pb-2 border-b border-warm-100">Cafe Information</h2>
        {fields.map(f => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input type={f.type} value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="input" />
          </div>
        ))}
        <div>
          <label className="label">Opening Hours (JSON)</label>
          <textarea value={settings.opening_hours || ''} onChange={e => set('opening_hours', e.target.value)} className="input font-mono text-sm" rows={3} />
          <p className="text-xs text-warm-400 mt-1">Example: {`{"Mon-Fri": "7:00 AM - 9:00 PM", "Sat-Sun": "8:00 AM - 10:00 PM"}`}</p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 py-3 px-8">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

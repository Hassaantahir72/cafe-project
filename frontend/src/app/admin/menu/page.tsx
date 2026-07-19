'use client';
import { useEffect, useState } from 'react';
import { menuAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', price: '', category_id: '', image_url: '', is_available: true, is_featured: false, is_vegetarian: false, calories: '', prep_time: 15, tags: '' };

export default function AdminMenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([menuAPI.getItems(), menuAPI.getCategories()])
      .then(([i, c]) => { setItems(i.data); setCategories(c.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ ...item, price: item.price?.toString(), calories: item.calories?.toString() || '', tags: item.tags?.join(', ') || '' });
    setModal('edit');
  };

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal('add'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), calories: form.calories ? parseInt(form.calories) : null, tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [] };
      if (modal === 'add') {
        const { data } = await menuAPI.createItem(payload);
        setItems(prev => [data, ...prev]);
        toast.success('Item added!');
      } else {
        const { data } = await menuAPI.updateItem(editing.id, payload);
        setItems(prev => prev.map(i => i.id === editing.id ? data : i));
        toast.success('Item updated!');
      }
      setModal(null);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await menuAPI.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item deleted');
    } catch { toast.error('Delete failed'); }
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-warm-500 text-sm">{items.length} items</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length: 6}).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-warm-100 animate-pulse"><div className="h-36 bg-warm-100"/><div className="p-4 space-y-2"><div className="h-4 bg-warm-100 rounded w-3/4"/><div className="h-3 bg-warm-100 rounded w-1/2"/></div></div>
        )) : items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-warm-100 overflow-hidden">
            <div className="h-36 bg-warm-100 relative">
              {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
              <div className="absolute top-2 right-2 flex gap-1.5">
                {!item.is_available && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Unavailable</span>}
                {item.is_featured && <span className="bg-cafe-500 text-white text-xs px-2 py-0.5 rounded-full">Featured</span>}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-warm-800 text-sm">{item.name}</h3>
                <span className="text-cafe-600 font-bold text-sm ml-2">${parseFloat(item.price).toFixed(2)}</span>
              </div>
              <p className="text-xs text-warm-400 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border border-warm-200 hover:bg-warm-50 text-warm-600 transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(item.id, item.name)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-warm-100">
              <h2 className="font-semibold text-warm-900">{modal === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-warm-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">Item Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="e.g. Flat White" /></div>
                <div><label className="label">Price ($) *</label><input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className="input" placeholder="4.50" /></div>
              </div>
              <div><label className="label">Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="input">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} className="input" rows={2} /></div>
              <div><label className="label">Image URL</label><input value={form.image_url} onChange={e => set('image_url', e.target.value)} className="input" placeholder="https://..." /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">Calories</label><input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} className="input" placeholder="320" /></div>
                <div><label className="label">Prep Time (min)</label><input type="number" value={form.prep_time} onChange={e => set('prep_time', parseInt(e.target.value))} className="input" /></div>
              </div>
              <div><label className="label">Tags <span className="text-warm-400 font-normal">(comma separated)</span></label><input value={form.tags} onChange={e => set('tags', e.target.value)} className="input" placeholder="bestseller, vegan, popular" /></div>
              <div className="flex gap-6 flex-wrap">
                {[['is_available','Available'],['is_featured','Featured'],['is_vegetarian','Vegetarian']].map(([k,l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-warm-700 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 accent-cafe-500" /> {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-warm-100">
              <button onClick={() => setModal(null)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

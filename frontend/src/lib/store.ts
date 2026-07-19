import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const exists = state.items.find(i => i.id === item.id);
        if (exists) return { items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i: any) => i.id !== id) })),
      updateQty: (id, qty) => set((s) => ({
        items: qty <= 0 ? s.items.filter((i: any) => i.id !== id) : s.items.map(i => i.id === id ? { ...i, quantity: qty } : i)
      })),
      updateNotes: (id, notes) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, notes } : i) })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cafe-cart' }
  )
);

interface AuthStore {
  user: any;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('cafe_token', token);
          localStorage.setItem('cafe_user', JSON.stringify(user));
        }
      },
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cafe_token');
          localStorage.removeItem('cafe_user');
        }
      },
      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'cafe-auth' }
  )
);

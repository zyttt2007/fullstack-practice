import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext<{ count: number; refresh: () => Promise<void> }>({
  count: 0,
  refresh: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      const res = await api.get('/cart');
      setCount(res.data.list.reduce((s: number, x: any) => s + x.quantity, 0));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return <CartContext.Provider value={{ count, refresh }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CartItem, ShippingAddress } from '@/types/cart';
import { ProductDisplay } from '@/types/product';

const CART_STORAGE_KEY = 'alerta-veiculos-cart';
const ADDRESS_STORAGE_KEY = 'alerta-veiculos-cart-address';

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function loadAddressFromStorage(): ShippingAddress | null {
  try {
    const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

interface CartContextType {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  addToCart: (product: ProductDisplay, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setShippingAddress: (address: ShippingAddress | null) => void;
  getTotal: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(loadAddressFromStorage);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (shippingAddress) {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(shippingAddress));
    } else {
      localStorage.removeItem(ADDRESS_STORAGE_KEY);
    }
  }, [shippingAddress]);

  const addToCart = useCallback((product: ProductDisplay, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.quantity) }
            : item
        );
      }
      
      return [...prevItems, { product, quantity: Math.min(quantity, product.quantity) }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.quantity) }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    setShippingAddress(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(ADDRESS_STORAGE_KEY);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        shippingAddress,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setShippingAddress,
        getTotal,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

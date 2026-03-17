"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useSyncExternalStore } from "react";
import { CartItem, getCart, saveCart } from "@/lib/cartStore";

let cachedCart: CartItem[] = [];

function subscribe(callback: () => void) {
  window.addEventListener("cart-updated", callback);
  return () => window.removeEventListener("cart-updated", callback);
}

function getSnapshot(): CartItem[] {
  const current = getCart();
  const currentStr = JSON.stringify(current);
  const cachedStr = JSON.stringify(cachedCart);
  if (currentStr !== cachedStr) {
    cachedCart = current;
  }
  return cachedCart;
}

const EMPTY: CartItem[] = [];

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function dispatch() {
  window.dispatchEvent(new Event("cart-updated"));
}

type CartContextType = {
  cart: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearItems: () => void;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: CartItem) => {
    const prev = getCart();
    const existing = prev.findIndex(
      (i) =>
        i.productId === item.productId &&
        JSON.stringify(i.extras) === JSON.stringify(item.extras),
    );
    if (existing >= 0) {
      prev[existing].quantity += item.quantity;
    } else {
      prev.push(item);
    }
    saveCart(prev);
    cachedCart = [...prev];
    dispatch();
  }, []);

  const removeItem = useCallback((index: number) => {
    const updated = getCart().filter((_, i) => i !== index);
    saveCart(updated);
    cachedCart = updated;
    dispatch();
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    const prev = getCart();
    prev[index] = { ...prev[index], quantity: Math.max(1, quantity) };
    saveCart(prev);
    cachedCart = [...prev];
    dispatch();
  }, []);

  const clearItems = useCallback(() => {
    saveCart([]);
    cachedCart = [];
    dispatch();
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQuantity, clearItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

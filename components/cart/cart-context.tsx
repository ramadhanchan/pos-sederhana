"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { Product } from "@/lib/types";

export interface CartLine {
  product: Product;
  qty: number;
}

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "ADD"; product: Product }
  | { type: "INCREMENT"; id: number }
  | { type: "DECREMENT"; id: number }
  | { type: "REMOVE"; id: number }
  | { type: "CLEAR" };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.lines.find((l) => l.product.id === action.product.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.product.id === action.product.id ? { ...l, qty: l.qty + 1 } : l
          ),
        };
      }
      return { lines: [...state.lines, { product: action.product, qty: 1 }] };
    }
    case "INCREMENT":
      return {
        lines: state.lines.map((l) => (l.product.id === action.id ? { ...l, qty: l.qty + 1 } : l)),
      };
    case "DECREMENT":
      return {
        lines: state.lines
          .map((l) => (l.product.id === action.id ? { ...l, qty: l.qty - 1 } : l))
          .filter((l) => l.qty > 0),
      };
    case "REMOVE":
      return { lines: state.lines.filter((l) => l.product.id !== action.id) };
    case "CLEAR":
      return { lines: [] };
  }
}

interface CartContextValue {
  items: CartLine[];
  add: (product: Product) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });

  const value: CartContextValue = {
    items: state.lines,
    add: (product) => dispatch({ type: "ADD", product }),
    increment: (id) => dispatch({ type: "INCREMENT", id }),
    decrement: (id) => dispatch({ type: "DECREMENT", id }),
    remove: (id) => dispatch({ type: "REMOVE", id }),
    clear: () => dispatch({ type: "CLEAR" }),
    total: state.lines.reduce((sum, l) => sum + l.product.price * l.qty, 0),
    count: state.lines.reduce((sum, l) => sum + l.qty, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}

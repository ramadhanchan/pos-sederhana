"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "./ui/toast";
import { CartProvider } from "./cart/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductGrid } from "@/components/kasir/product-grid";
import { CartPanel } from "@/components/kasir/cart-panel";
import { Receipt } from "@/components/kasir/receipt";
import { useCart } from "@/components/cart/cart-context";
import { useToast } from "@/components/ui/toast";
import type { Transaction } from "@/lib/types";

export default function KasirPage() {
  const { items, clear } = useCart();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((l) => ({ productId: l.product.id, qty: l.qty })),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? "Checkout gagal");
      }
      return body.transaction as Transaction;
    },
    onSuccess: (transaction) => {
      clear();
      setReceipt(transaction);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Transaksi tersimpan");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1e293b] mb-4">Kasir</h1>
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 w-full">
          <ProductGrid />
        </div>
        <div className="w-full lg:w-80 lg:sticky lg:top-6">
          <CartPanel onCheckout={() => checkout.mutate()} checkoutBusy={checkout.isPending} />
        </div>
      </div>
      <Receipt transaction={receipt} open={receipt !== null} onClose={() => setReceipt(null)} />
    </div>
  );
}

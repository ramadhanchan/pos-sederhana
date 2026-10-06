"use client";

import { useCart } from "@/components/cart/cart-context";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function CartPanel({ onCheckout, checkoutBusy }: { onCheckout?: () => void; checkoutBusy?: boolean }) {
  const { items, increment, decrement, remove, total, count } = useCart();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#1e293b]">Keranjang</h2>
        <span className="text-xs text-slate-500 tabular">{count} item</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[50vh] p-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Keranjang kosong</p>
        ) : (
          <ul className="space-y-2">
            {items.map((line) => (
              <li
                key={line.product.id}
                className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-2"
              >
                <span className="text-lg">{line.product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1e293b] truncate text-xs">
                    {line.product.name}
                  </div>
                  <div className="text-[#d97706] text-xs tabular font-semibold">
                    {formatRupiah(line.product.price * line.qty)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => decrement(line.product.id)}
                    aria-label={`Kurangi ${line.product.name}`}
                    className="w-6 h-6 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 leading-none"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs tabular">{line.qty}</span>
                  <button
                    onClick={() => increment(line.product.id)}
                    aria-label={`Tambah ${line.product.name}`}
                    className="w-6 h-6 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 leading-none"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(line.product.id)}
                  aria-label={`Hapus ${line.product.name}`}
                  className="text-red-500 hover:text-red-700 text-xs px-1"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-600">Total</span>
          <span className="font-semibold text-[#1e293b] tabular">{formatRupiah(total)}</span>
        </div>
        <Button
          variant="accent"
          className="w-full"
          disabled={items.length === 0 || checkoutBusy}
          onClick={onCheckout}
        >
          {checkoutBusy ? "Memproses…" : "Checkout"}
        </Button>
      </div>
    </div>
  );
}

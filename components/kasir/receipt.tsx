"use client";

import type { Transaction } from "@/lib/types";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function Receipt({
  transaction,
  open,
  onClose,
}: {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!transaction) return null;

  return (
    <Modal open={open} onClose={onClose} title="Struk Penjualan">
      <div className="print-area">
        <div className="text-center mb-4">
          <div className="text-2xl">🏪</div>
          <div className="font-semibold text-[#1e293b]">Toko Sederhana</div>
          <div className="text-xs text-slate-500">Jl. Belajar No. 1</div>
        </div>

        <div className="text-xs text-slate-500 flex justify-between border-b border-dashed border-slate-300 pb-2 mb-2">
          <span>No. #{transaction.id}</span>
          <span>{formatDateTime(transaction.createdAt)}</span>
        </div>

        <ul className="text-sm space-y-1.5 mb-3">
          {transaction.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-[#1e293b]">
                {item.name} × {item.qty}
              </span>
              <span className="tabular text-slate-600">
                {formatRupiah(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 font-semibold text-[#1e293b]">
          <span>Total</span>
          <span className="tabular">{formatRupiah(transaction.total)}</span>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">Terima kasih atas kunjungan Anda</p>
      </div>

      <div className="mt-5 flex gap-2 justify-end no-print">
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
        <Button variant="accent" onClick={() => window.print()}>
          Cetak
        </Button>
      </div>
    </Modal>
  );
}

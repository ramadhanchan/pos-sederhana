"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/lib/types";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Table } from "@/components/ui/card";

export default function RiwayatPage() {
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Gagal memuat riwayat");
      const body = (await res.json()) as { transactions: Transaction[] };
      return body.transactions;
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1e293b] mb-4">Riwayat Transaksi</h1>

      {isPending ? (
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
      ) : !data || data.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          Belum ada transaksi
        </div>
      ) : (
        <Table>
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
              <th className="px-4 py-3 text-left">No.</th>
              <th className="px-4 py-3 text-left">Waktu</th>
              <th className="px-4 py-3 text-right">Item</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelected(selected?.id === t.id ? null : t)}
                className={`border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 ${
                  selected?.id === t.id ? "bg-amber-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-[#1e293b]">#{t.id}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(t.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular text-slate-600">
                  {t.items.reduce((sum, i) => sum + i.qty, 0)} item
                </td>
                <td className="px-4 py-3 text-right tabular font-semibold text-[#1e293b]">
                  {formatRupiah(t.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {selected && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-sm text-[#1e293b] mb-3">
            Detail Transaksi #{selected.id}
          </h2>
          <ul className="text-sm space-y-1.5">
            {selected.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span className="text-slate-700">
                  {item.name} × {item.qty}
                </span>
                <span className="tabular text-slate-500">@{formatRupiah(item.price)}</span>
                <span className="tabular font-medium text-[#1e293b]">
                  {formatRupiah(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-slate-200 mt-3 pt-2 font-semibold text-sm text-[#1e293b]">
            <span>Total</span>
            <span className="tabular">{formatRupiah(selected.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

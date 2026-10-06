"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/lib/types";
import { formatRupiah, localDate } from "@/lib/format";
import { Card } from "@/components/ui/card";

interface TopProduct {
  name: string;
  qty: number;
}

export default function LaporanPage() {
  const [date, setDate] = useState(() => localDate());
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const { data, isPending } = useQuery({
    queryKey: ["transactions", date],
    enabled: validDate,
    queryFn: async () => {
      const res = await fetch(`/api/transactions?date=${date}`);
      if (!res.ok) throw new Error("Gagal memuat laporan");
      const body = (await res.json()) as { transactions: Transaction[] };
      return body.transactions;
    },
  });

  const transactions = data ?? [];
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const transactionCount = transactions.length;

  const topProducts: TopProduct[] = Object.values(
    transactions.reduce<Record<string, TopProduct>>((acc, t) => {
      for (const item of t.items) {
        acc[item.name] = acc[item.name] ?? { name: item.name, qty: 0 };
        acc[item.name].qty += item.qty;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-[#1e293b]">Laporan Harian</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="report-date" className="text-sm text-slate-600">
            Tanggal
          </label>
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#d97706] text-sm tabular"
          />
        </div>
      </div>

      {!validDate ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          Pilih tanggal terlebih dahulu
        </div>
      ) : isPending ? (
        <div className="h-40 rounded-xl bg-slate-200 animate-pulse" />
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          Belum ada penjualan tanggal ini
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-sm text-slate-500 mb-1">Total Penjualan</div>
              <div className="text-2xl font-semibold text-[#1e293b] tabular">
                {formatRupiah(totalSales)}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-slate-500 mb-1">Jumlah Transaksi</div>
              <div className="text-2xl font-semibold text-[#1e293b] tabular">
                {transactionCount}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-[#1e293b] mb-3">Produk Paling Laris</h2>
            <ol className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#d97706] text-white text-xs flex items-center justify-center font-semibold">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-slate-700">{p.name}</span>
                  <span className="tabular text-slate-500">{p.qty} terjual</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}

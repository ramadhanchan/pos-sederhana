"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category, Product } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { StockBadge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-context";

const FILTERS: { value: Category | ""; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "makanan", label: "Makanan" },
  { value: "minuman", label: "Minuman" },
  { value: "lainnya", label: "Lainnya" },
];

export function ProductGrid() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isPending } = useQuery({
    queryKey: ["products", debouncedQ, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (category) params.set("category", category);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat produk");
      const body = (await res.json()) as { products: Product[] };
      return body.products;
    },
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const first = data?.[0];
      if (first) add(first);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Cari produk… (tekan /)"
          aria-label="Cari produk"
          className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#d97706] text-sm"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategory(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === f.value
                  ? "bg-[#1e293b] text-white"
                  : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">Produk tidak ditemukan</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p)}
              disabled={p.stock === 0}
              className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#d97706] hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl mb-2">{p.emoji}</div>
              <div className="font-medium text-sm text-[#1e293b] leading-tight">{p.name}</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[#d97706] font-semibold text-sm tabular">
                  {formatRupiah(p.price)}
                </span>
                <StockBadge stock={p.stock} />
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400">
        <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">/</kbd> cari ·{" "}
        <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">Enter</kbd> tambah
        hasil pertama
      </p>
    </div>
  );
}

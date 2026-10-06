"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { StockBadge } from "@/components/ui/badge";
import { Table } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ProductFormModal } from "@/components/produk/product-form-modal";

export default function ProdukPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Gagal memuat produk");
      const body = (await res.json()) as { products: Product[] };
      return body.products;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? "Gagal menghapus");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produk dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(p: Product) {
    if (confirm(`Hapus produk "${p.name}"?`)) remove.mutate(p.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[#1e293b]">Produk</h1>
        <Button
          variant="accent"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Tambah Produk
        </Button>
      </div>

      {isPending ? (
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
      ) : (
        <Table>
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
              <th className="px-4 py-3 text-left">Produk</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="mr-2">{p.emoji}</span>
                  <span className="font-medium text-[#1e293b]">{p.name}</span>
                </td>
                <td className="px-4 py-3 text-slate-600 capitalize">{p.category}</td>
                <td className="px-4 py-3 text-right tabular text-[#1e293b]">
                  {formatRupiah(p.price)}
                </td>
                <td className="px-4 py-3 text-right tabular">{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <StockBadge stock={p.stock} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setModalOpen(true);
                    }}
                    className="text-sm text-[#d97706] hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ProductFormModal open={modalOpen} product={editing} onClose={() => setModalOpen(false)} />
    </div>
  );
}

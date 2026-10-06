"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, type Category, type Product } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface FormState {
  name: string;
  category: Category;
  price: string;
  stock: string;
  emoji: string;
}

const EMPTY: FormState = { name: "", category: "makanan", price: "", stock: "", emoji: "" };

export function ProductFormModal({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              category: product.category,
              price: String(product.price),
              stock: String(product.stock),
              emoji: product.emoji,
            }
          : EMPTY
      );
      setLocalError(null);
    }
  }, [open, product]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        emoji: form.emoji.trim() || undefined,
      };
      const res = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
        method: product ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error((body as { error?: string }).error ?? "Gagal menyimpan");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? "Produk diperbarui" : "Produk ditambahkan");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setLocalError("Nama wajib diisi");
      return;
    }
    if (!Number.isInteger(Number(form.price)) || Number(form.price) < 0) {
      setLocalError("Harga harus bilangan bulat tidak negatif");
      return;
    }
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      setLocalError("Stok harus bilangan bulat tidak negatif");
      return;
    }
    setLocalError(null);
    save.mutate();
  }

  const input =
    "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d97706] text-sm text-[#1e293b]";

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit Produk" : "Tambah Produk"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="p-name" className="block text-sm font-medium text-[#1e293b] mb-1">
            Nama
          </label>
          <input
            id="p-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={input}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-cat" className="block text-sm font-medium text-[#1e293b] mb-1">
              Kategori
            </label>
            <select
              id="p-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className={input}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-emoji" className="block text-sm font-medium text-[#1e293b] mb-1">
              Emoji (opsional)
            </label>
            <input
              id="p-emoji"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="📦"
              className={input}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-price" className="block text-sm font-medium text-[#1e293b] mb-1">
              Harga (Rp)
            </label>
            <input
              id="p-price"
              type="number"
              min={0}
              step={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={`${input} tabular`}
              required
            />
          </div>
          <div>
            <label htmlFor="p-stock" className="block text-sm font-medium text-[#1e293b] mb-1">
              Stok
            </label>
            <input
              id="p-stock"
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className={`${input} tabular`}
              required
            />
          </div>
        </div>
        {localError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {localError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="accent" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

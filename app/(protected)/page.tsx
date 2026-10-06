"use client";

import { ProductGrid } from "@/components/kasir/product-grid";
import { CartPanel } from "@/components/kasir/cart-panel";

export default function KasirPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1e293b] mb-4">Kasir</h1>
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 w-full">
          <ProductGrid />
        </div>
        <div className="w-full lg:w-80 lg:sticky lg:top-6">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}

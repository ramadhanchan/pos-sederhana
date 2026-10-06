"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Kasir", icon: "🛒" },
  { href: "/produk", label: "Produk", icon: "📦" },
  { href: "/riwayat", label: "Riwayat", icon: "🧾" },
  { href: "/laporan", label: "Laporan", icon: "📊" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#1e293b] text-white min-h-screen p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <span className="text-2xl">🏪</span>
          <div>
            <div className="font-semibold leading-tight">Toko Sederhana</div>
            <div className="text-xs text-slate-400">POS Sederhana</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#d97706] text-white"
                    : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
        >
          <span>🚪</span>
          Logout
        </button>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#1e293b] text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <span className="font-semibold">Toko Sederhana</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-300 px-2 py-1">
            Logout
          </button>
        </div>
        <nav className="flex overflow-x-auto gap-1 px-2 pb-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  active ? "bg-[#d97706] text-white" : "text-slate-300"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "danger" | "accent";

const styles: Record<Variant, string> = {
  primary: "bg-[#1e293b] text-white hover:bg-slate-800",
  outline: "border border-slate-300 text-[#1e293b] hover:bg-slate-100",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
  accent: "bg-[#d97706] text-white hover:bg-amber-700",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

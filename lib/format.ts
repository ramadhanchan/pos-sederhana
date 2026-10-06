const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

export function formatRupiah(n: number): string {
  return rupiah.format(n);
}

export function formatDateTime(local: string): string {
  // local format: "YYYY-MM-DD HH:MM:SS"
  const [date, time] = local.split(" ");
  if (!date) return local;
  const [y, m, d] = date.split("-");
  const short = `${d}/${m}/${y}`;
  return time ? `${short} ${time.slice(0, 5)}` : short;
}

export function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

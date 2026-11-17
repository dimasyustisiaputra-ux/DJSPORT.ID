export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const rentangHarga = (min: number, max: number) => (min === max ? rupiah(min) : `${rupiah(min)} – ${rupiah(max)}`);

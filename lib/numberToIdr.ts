type T_NumberToIdrProps = {
  currency?: "IDR";
  format?: "id-ID";
  nominal: number;
};
export function numberToIdr({
  nominal,
  currency = "IDR",
  format = "id-ID",
}: T_NumberToIdrProps) {
  return new Intl.NumberFormat(format, {
    style: "currency",
    currency: currency,
  }).format(nominal);
}

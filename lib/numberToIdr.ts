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
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
}

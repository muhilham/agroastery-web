type T_NumberToIdrProps = {
  currency?: "IDR";
  format?: "id-ID";
  nominal: number;
};

export function numberToIdr({ nominal }: T_NumberToIdrProps) {
  const rounded = Math.round(Math.abs(nominal));
  const str = rounded.toString();
  const parts: string[] = [];
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i));
  }
  const sign = nominal < 0 ? "-" : "";
  return `${sign}Rp\u00A0${parts.join(".")}`;
}

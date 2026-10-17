export function formatNumberWithCommas(value: string | number, allowDecimal = true): string {
  if (value === "") return "";

  let cleaned = String(value).replace(/[^\d.]/g, "");
  if (!allowDecimal) cleaned = cleaned.replace(/\./g, "");

  if (allowDecimal) {
    const lastDotIndex = cleaned.lastIndexOf(".");
    const firstDotIndex = cleaned.indexOf(".");
    if (lastDotIndex !== firstDotIndex) {
      const beforeLastDot = cleaned.slice(0, lastDotIndex).replace(/\./g, "");
      cleaned = `${beforeLastDot}.${cleaned.slice(lastDotIndex + 1)}`;
    }
  }

  if (cleaned === ".") return ".";

  const [integerPart = "", decimalPart] = cleaned.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

export function formatNumberInputValue(value: string | number, allowDecimal = true): string {
  if (value === 0 || value === "0" || value === "0.00") return "";
  return formatNumberWithCommas(value, allowDecimal);
}

export function parseFormattedNumber(value: string, allowDecimal = true): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = allowDecimal ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

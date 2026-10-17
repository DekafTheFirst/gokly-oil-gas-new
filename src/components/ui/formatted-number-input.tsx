import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { formatNumberInputValue, formatNumberWithCommas, parseFormattedNumber } from "@/lib/number-format";

interface FormattedNumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number | string;
  onValueChange: (value: number | string) => void;
  allowDecimal?: boolean;
}

export function FormattedNumberInput({
  value,
  onValueChange,
  allowDecimal = true,
  inputMode,
  ...inputProps
}: FormattedNumberInputProps) {
  const formattedValue = formatNumberInputValue(value, allowDecimal);

  return (
    <Input
      {...inputProps}
      type="text"
      inputMode={inputMode || (allowDecimal ? "decimal" : "numeric")}
      value={formattedValue}
      onChange={(event) => {
        const formatted = formatNumberWithCommas(event.target.value, allowDecimal);
        if (typeof value === "number") {
          onValueChange(parseFormattedNumber(formatted, allowDecimal));
        } else {
          onValueChange(formatted.replace(/,/g, ""));
        }
      }}
    />
  );
}

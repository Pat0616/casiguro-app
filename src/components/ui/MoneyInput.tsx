import { forwardRef, InputHTMLAttributes, useImperativeHandle, useLayoutEffect, useRef } from "react";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  /** Raw amount text without ₱ or commas, e.g. "1250.5" ("" = empty) */
  value: string;
  onValueChange: (raw: string) => void;
};

const RAW_PATTERN = /^\d*\.?\d{0,2}$/;

/** "1250.5" → "₱1,250.5", "" → "" (so the placeholder shows) */
export function formatMoneyText(raw: string): string {
  if (raw === "") return "";
  const [whole, decimals] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₱${grouped}${raw.includes(".") ? `.${decimals ?? ""}` : ""}`;
}

// Digits and the decimal point; ₱ and commas are decoration
const isSignificant = (char: string) => char === "." || (char >= "0" && char <= "9");

/**
 * Peso amount field that shows ₱ and thousands commas while typing (₱12,500.75).
 * Accepts digits and up to 2 decimals; typed or pasted ₱, commas and spaces are ignored.
 * Plain text input, so there are no spinner arrows and the mouse wheel can't change the amount.
 */
const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput({ value, onValueChange, ...props }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  // Number of significant characters before the caret, restored after the commas move
  const pendingCaret = useRef<number | null>(null);
  const display = formatMoneyText(value);

  useLayoutEffect(() => {
    const el = inputRef.current;
    const count = pendingCaret.current;
    if (!el || count == null || document.activeElement !== el) return;
    pendingCaret.current = null;
    let position = display.startsWith("₱") ? 1 : 0;
    let seen = 0;
    while (position < display.length && seen < count) {
      if (isSignificant(display[position])) seen++;
      position++;
    }
    el.setSelectionRange(position, position);
  });

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={display}
      onChange={(event) => {
        const typed = event.target.value;
        const raw = typed.replace(/[₱,\s]/g, "").replace(/^0+(?=\d)/, ""); // "0350" → "350"
        if (!RAW_PATTERN.test(raw)) return;
        const caret = event.target.selectionStart ?? typed.length;
        pendingCaret.current = Array.from(typed.slice(0, caret)).filter(isSignificant).length;
        onValueChange(raw);
      }}
    />
  );
});

export default MoneyInput;

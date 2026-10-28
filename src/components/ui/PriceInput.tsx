import { InputHTMLAttributes, KeyboardEvent, useEffect, useState } from "react";

type PriceInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: number;
  onChange: (value: number) => void;
};

const PRICE_PATTERN = /^\d*\.?\d{0,2}$/;
const toNumber = (text: string) => (text === "" || text === "." ? 0 : Number(text));

// "" → "0", "0350" → "350", "350." → "350", ".5" → "0.5"
function finish(text: string) {
  const trimmed = text.replace(/\.$/, "").replace(/^0+(?=\d)/, "");
  if (trimmed === "") return "0";
  return trimmed.startsWith(".") ? `0${trimmed}` : trimmed;
}

// Peso amount field that can be cleared while typing (counts as 0) and becomes "0" on Enter or blur.
// Plain text input, so there are no spinner arrows and the mouse wheel can't change the price.
export default function PriceInput({ value, onChange, onBlur, onKeyDown, ...props }: PriceInputProps) {
  const [text, setText] = useState(() => String(value));

  // Follow outside changes (e.g. a different option picked) without refilling a field the user just cleared
  useEffect(() => {
    setText((current) => (toNumber(current) === value ? current : String(value)));
  }, [value]);

  const commit = () => setText((current) => finish(current));

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        const next = event.target.value.trim();
        if (!PRICE_PATTERN.test(next)) return;
        setText(next);
        onChange(toNumber(next));
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
        onKeyDown?.(event);
      }}
      onBlur={(event) => {
        commit();
        onBlur?.(event);
      }}
    />
  );
}

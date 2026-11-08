import { InputHTMLAttributes, KeyboardEvent, useEffect, useState } from "react";

type QuantityInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: number;
  onChange: (value: number) => void;
};

const QUANTITY_PATTERN = /^\d{0,6}$/;
const toNumber = (text: string) => (text === "" ? 0 : Number(text));

// "" → "1", "0" → "1", "007" → "7"
function finish(text: string) {
  const trimmed = text.replace(/^0+(?=\d)/, "");
  return trimmed === "" || Number(trimmed) === 0 ? "1" : trimmed;
}

// Whole-number quantity field that can be cleared while typing (counts as 0) and becomes at least 1 on Enter or blur.
// Plain text input like PriceInput, so there are no spinner arrows and the mouse wheel can't change the quantity.
export default function QuantityInput({ value, onChange, onBlur, onKeyDown, ...props }: QuantityInputProps) {
  const [text, setText] = useState(() => String(value));

  // Follow outside changes (e.g. the same catalog item added again) without refilling a field the user just cleared
  useEffect(() => {
    setText((current) => (toNumber(current) === value ? current : String(value)));
  }, [value]);

  const commit = () => {
    const finished = finish(text);
    setText(finished);
    if (Number(finished) !== value) onChange(Number(finished));
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        const next = event.target.value.trim();
        if (!QUANTITY_PATTERN.test(next)) return;
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

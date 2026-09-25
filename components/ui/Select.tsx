import type { SelectHTMLAttributes } from "react";

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <select className="select" {...props}>
        {children}
      </select>
    </label>
  );
}

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <input className="field" {...props} />
    </label>
  );
}

export function Area({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <textarea className="field" {...props} />
    </label>
  );
}

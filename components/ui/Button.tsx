import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "quiet" | "danger" };

export function Button({ tone = "primary", className = "", ...props }: Props) {
  const toneClass = tone === "primary" ? "" : tone;
  return <button className={`btn ${toneClass} ${className}`.trim()} {...props} />;
}

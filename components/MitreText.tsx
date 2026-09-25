"use client";

/**
 * Turns a real ATT&CK id in running text into a link and a one-line tooltip.
 * Ids we do not have locally stay plain text, so we never link a typo.
 */

import { technique, techniqueUrl } from "@/lib/mitre";

export function MitreText({ text }: { text: string }) {
  const parts = text.split(/(\bT\d{4}(?:\.\d{3})?\b)/g);
  return (
    <>
      {parts.map((part, index) => {
        const known = /^T\d{4}/.test(part) ? technique(part) : undefined;
        if (!known) return <span key={`${part}-${index}`}>{part}</span>;
        return (
          <a
            key={`${part}-${index}`}
            className="mitre"
            href={techniqueUrl(known.id)}
            title={`${known.name}. ${known.description}`}
            target="_blank"
            rel="noreferrer"
          >
            {known.id}
          </a>
        );
      })}
    </>
  );
}

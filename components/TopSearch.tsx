"use client";

/**
 * One search, on every page. Same idea as a Shodan bar: type an indicator
 * and land on the case card. The server still refuses to fetch the URL.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TopSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className="top-search"
      onSubmit={(event) => {
        event.preventDefault();
        const value = q.trim();
        if (!value) return;
        router.push(`/lookup?q=${encodeURIComponent(value)}`);
      }}
    >
      <input
        className="field"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search an IP, domain, URL, or hash"
        aria-label="Search an IP, domain, URL, or hash"
        spellCheck={false}
      />
      <button className="btn" type="submit">
        Search
      </button>
    </form>
  );
}

"use client";

/**
 * Left rail. Collapsed to icons. Hover or keyboard focus expands labels.
 * The page underneath does not reflow. Accent and density live here and
 * in localStorage, not in a database.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/cves", label: "CVEs" },
  { href: "/lookup", label: "Lookup" },
  { href: "/hunt", label: "Hunt" },
  { href: "/c2", label: "C2" },
  { href: "/mail", label: "Mail" },
  { href: "/intel", label: "Intel" },
  { href: "/vulns", label: "Vulns" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/lab", label: "Lab" },
];

export function NavRail() {
  const path = usePathname();
  const [accent, setAccent] = useState("phosphor");
  const [density, setDensity] = useState("compact");

  useEffect(() => {
    const storedAccent = localStorage.getItem("gh-accent") || "phosphor";
    const storedDensity = localStorage.getItem("gh-density") || "compact";
    setAccent(storedAccent);
    setDensity(storedDensity);
    document.documentElement.dataset.accent = storedAccent;
    document.documentElement.dataset.density = storedDensity;
  }, []);

  function apply(nextAccent: string, nextDensity: string) {
    setAccent(nextAccent);
    setDensity(nextDensity);
    document.documentElement.dataset.accent = nextAccent;
    document.documentElement.dataset.density = nextDensity;
    localStorage.setItem("gh-accent", nextAccent);
    localStorage.setItem("gh-density", nextDensity);
  }

  return (
    <nav className="rail" aria-label="Sections">
      <div className="rail-mark">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="2" fill="currentColor" />
          <path d="M10 1 v4 M10 15 v4 M1 10 h4 M15 10 h4" stroke="currentColor" />
        </svg>
        <span className="label">GH</span>
      </div>
      {ITEMS.map((item) => {
        const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "item active" : "item"}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3" width="14" height="14" fill="none" stroke="currentColor" />
            </svg>
            <span className="label">{item.label}</span>
          </Link>
        );
      })}
      <div className="rail-spacer" />
      <div className="extra">
        <label className="lbl">
          Accent
          <select className="select" value={accent} onChange={(event) => apply(event.target.value, density)} aria-label="Accent">
            <option value="phosphor">Phosphor</option>
            <option value="amber">Amber</option>
            <option value="ice">Ice</option>
          </select>
        </label>
        <label className="lbl">
          Density
          <select className="select" value={density} onChange={(event) => apply(accent, event.target.value)} aria-label="Density">
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </label>
      </div>
    </nav>
  );
}

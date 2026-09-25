"use client";

/**
 * Left rail. Collapsed to icons. Hover or keyboard focus expands labels.
 * Each section has its own mark so the collapsed rail is readable.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <Mark>
        <circle cx="12" cy="12" r="3" {...stroke} />
        <path d="M12 3 v3 M12 18 v3 M3 12 h3 M18 12 h3 M5.6 5.6 l2 2 M16.4 16.4 l2 2 M18.4 5.6 l-2 2 M7.6 16.4 l-2 2" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/cves",
    label: "CVEs",
    icon: (
      <Mark>
        <path d="M12 3 l8 3 v6 c0 5-3.4 8-8 9-4.6-1-8-4-8-9 V6 z" {...stroke} />
        <path d="M12 8 v4" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/lookup",
    label: "Lookup",
    icon: (
      <Mark>
        <circle cx="11" cy="11" r="6" {...stroke} />
        <path d="M16 16 l5 5" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/hunt",
    label: "Hunt",
    icon: (
      <Mark>
        <circle cx="12" cy="12" r="6" {...stroke} />
        <path d="M12 2 v4 M12 18 v4 M2 12 h4 M18 12 h4" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/c2",
    label: "C2",
    icon: (
      <Mark>
        <rect x="3" y="4" width="18" height="6" rx="1" {...stroke} />
        <rect x="3" y="14" width="18" height="6" rx="1" {...stroke} />
        <path d="M7 7 h.1 M7 17 h.1" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/mail",
    label: "Mail",
    icon: (
      <Mark>
        <rect x="3" y="5" width="18" height="14" rx="1.5" {...stroke} />
        <path d="M4 7 l8 6 8-6" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/intel",
    label: "Intel",
    icon: (
      <Mark>
        <path d="M6 4 h11 a2 2 0 0 1 2 2 v14 H8 a2 2 0 0 1-2-2 z" {...stroke} />
        <path d="M9 9 h7 M9 13 h5" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/vulns",
    label: "Vulns",
    icon: (
      <Mark>
        <path d="M12 3 l9 16 H3 z" {...stroke} />
        <path d="M12 9 v5 M12 16.5 v.5" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/sandbox",
    label: "Sandbox",
    icon: (
      <Mark>
        <path d="M9 3 h6 M10 3 v3 L6 20 h12 L14 6 V3" {...stroke} />
        <path d="M8 13 h8" {...stroke} />
      </Mark>
    ),
  },
  {
    href: "/lab",
    label: "Lab",
    icon: (
      <Mark>
        <ellipse cx="12" cy="6" rx="7" ry="3" {...stroke} />
        <path d="M5 6 v8 c0 2 3 4 7 4 s7-2 7-4 V6" {...stroke} />
        <path d="M5 10 c2 1.4 4 2 7 2 s5-.6 7-2" {...stroke} />
      </Mark>
    ),
  },
];

export function NavRail() {
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="rail" aria-label="Sections">
      <div className="rail-mark">
        <Mark>
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
          <path d="M12 2 v4 M12 18 v4 M2 12 h4 M18 12 h4" {...stroke} />
        </Mark>
        <span className="label">Ghost Hunt</span>
      </div>
      {ITEMS.map((item) => {
        const active = mounted && (item.href === "/" ? path === "/" : path.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={active ? "item active" : "item"}>
            {item.icon}
            <span className="label">{item.label}</span>
          </Link>
        );
      })}
      <div className="rail-spacer" />
    </nav>
  );
}

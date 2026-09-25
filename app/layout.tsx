import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist-mono/400.css";
import { NavRail } from "@/components/NavRail";
import { TopSearch } from "@/components/TopSearch";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost Hunt",
  description: "First-look triage for an analyst on shift.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavRail />
        <div className="shell">
          <TopSearch />
          {children}
        </div>
      </body>
    </html>
  );
}

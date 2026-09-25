"use client";

import dynamic from "next/dynamic";

/** Leaflet touches window, so the map never renders on the server. */
export const ThreatMap = dynamic(() => import("./ThreatMap").then((mod) => mod.ThreatMap), {
  ssr: false,
  loading: () => <p className="quiet">Loading map…</p>,
});

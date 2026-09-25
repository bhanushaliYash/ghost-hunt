"use client";

import type { MapPoint } from "@/lib/types";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function ThreatMap({ points }: { points: MapPoint[] }) {
  useEffect(() => {
    /* Leaflet reads window. Importing CSS here keeps tiles off the server bundle. */
  }, []);
  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.lat, point.lng]}
          radius={point.kind === "c2" ? 6 : 5}
          pathOptions={{ color: point.kind === "c2" ? "#b6ff3b" : "#e6b450", weight: 1, fillOpacity: 0.8 }}
        >
          <Popup>
            <span>{point.label}</span>
            {point.href ? (
              <>
                <br />
                <a href={point.href}>{point.kind === "c2" ? "Look up" : "Source"}</a>
              </>
            ) : null}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

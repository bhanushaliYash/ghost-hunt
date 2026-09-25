"use client";

/**
 * Draggable map of Check Point's live feed. Pan, zoom, and click an arc.
 * Coordinates come from the feed, not from a guessed country dot.
 */

import type { LiveAttack } from "@/lib/sources/radware";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function arc(from: [number, number], to: [number, number]): [number, number][] {
  const points: [number, number][] = [];
  for (let step = 0; step <= 32; step += 1) {
    const t = step / 32;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + (to[1] - from[1]) * t;
    const bulge = Math.sin(Math.PI * t) * 10;
    points.push([lat + bulge * 0.35, lng]);
  }
  return points;
}

function Fly({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, Math.max(map.getZoom(), 3), { duration: 0.7 });
  }, [map, target]);
  return null;
}

export function ThreatMap() {
  const [attacks, setAttacks] = useState<LiveAttack[]>([]);
  const [selected, setSelected] = useState<LiveAttack | null>(null);
  const [note, setNote] = useState("Pulling live attacks…");

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/threatmap")
        .then((response) => response.json())
        .then((body: { attacks?: LiveAttack[] }) => {
          if (stop) return;
          const rows = body.attacks ?? [];
          setAttacks(rows);
          const count = rows.length === 1 ? "1 live attack" : `${rows.length} live attacks`;
          setNote(rows.length ? count : "Check Point feed is quiet. Drag the map anyway.");
        })
        .catch(() => {
          if (!stop) setNote("Check Point feed did not answer.");
        });
    };
    load();
    const timer = window.setInterval(load, 25000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        scrollWheelZoom
        worldCopyJump
        zoomControl={false}
      >
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <Fly target={selected ? selected.to : null} />
        {attacks.map((attack) => (
          <Polyline
            key={attack.id}
            className="attack-arc"
            positions={arc(attack.from, attack.to)}
            pathOptions={{ color: "#ff2a2a", weight: selected?.id === attack.id ? 3 : 1.6, opacity: 0.9 }}
            eventHandlers={{ click: () => setSelected(attack) }}
          >
            <Tooltip>
              {attack.source} → {attack.destination}
              <br />
              {attack.weight}
            </Tooltip>
          </Polyline>
        ))}
        {attacks.map((attack) => (
          <CircleMarker
            key={`${attack.id}-dst`}
            center={attack.to}
            radius={selected?.id === attack.id ? 6 : 3.5}
            pathOptions={{ color: "#ff2a2a", fillColor: "#ff2a2a", fillOpacity: 0.85, weight: 1 }}
            eventHandlers={{ click: () => setSelected(attack) }}
          />
        ))}
      </MapContainer>
      <aside className="map-dock">
        <p className="map-note">
          {note}
          {" · "}
          <a href="https://threatmap.checkpoint.com/" target="_blank" rel="noreferrer">
            Check Point threat map
          </a>
        </p>
        <ul>
          {attacks.slice(0, 6).map((attack) => (
            <li key={`list-${attack.id}`}>
              <button type="button" onClick={() => setSelected(attack)}>
                <b>
                  {attack.source} → {attack.destination}
                </b>
                <span>{attack.weight}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

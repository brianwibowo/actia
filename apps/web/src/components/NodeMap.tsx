import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeviceSummary } from '../types';
import { fmtNum, formatRelativeTime } from '../lib/api';

interface NodeMapProps {
  devices: DeviceSummary[];
  onSelectDevice?: (id: string) => void;
  pickCoords?: { lat: number | null; lng: number | null };
  onPickCoords?: (lat: number, lng: number) => void;
  height?: number;
}

function markerColor(d: DeviceSummary): string {
  if (d.status === 'offline') return '#b91c1c';
  if (d.open_alerts > 0 || d.status === 'maintenance') return '#b45309';
  return '#047857';
}

export function NodeMap({
  devices,
  onSelectDevice,
  pickCoords,
  onPickCoords,
  height = 420,
}: NodeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-6.9175, 107.6191],
      zoom: 7,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onPickCoords) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onPickCoords(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6)),
      );
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [onPickCoords]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds: [number, number][] = [];

    if (pickCoords?.lat != null && pickCoords?.lng != null) {
      const pos: [number, number] = [pickCoords.lat, pickCoords.lng];
      L.circleMarker(pos, {
        radius: 9,
        color: '#0f172a',
        weight: 2,
        fillColor: '#047857',
        fillOpacity: 0.92,
      })
        .bindTooltip('Lokasi node terpilih')
        .addTo(layer);
      map.setView(pos, Math.max(map.getZoom(), 12));
      return;
    }

    for (const d of devices) {
      if (d.lat === null || d.lng === null) continue;
      const pos: [number, number] = [d.lat, d.lng];
      bounds.push(pos);

      const marker = L.circleMarker(pos, {
        radius: 9,
        color: '#ffffff',
        weight: 2.5,
        fillColor: markerColor(d),
        fillOpacity: 0.95,
      });

      const statusLabel =
        d.status === 'online'
          ? 'Online'
          : d.status === 'maintenance'
            ? 'Pemeliharaan'
            : 'Offline';

      marker.bindPopup(
        `<strong>${d.code} - ${d.name}</strong><br/>` +
          `Status: ${statusLabel}<br/>` +
          `Suhu: ${fmtNum(d.temperature_c, ' °C')}<br/>` +
          `Soil moisture: ${fmtNum(d.soil_moisture_pct, '%')}<br/>` +
          `Baterai: ${fmtNum(d.battery_pct, '%', 0)}<br/>` +
          `Terakhir: ${formatRelativeTime(d.last_seen)}`,
      );

      if (onSelectDevice) {
        marker.on('dblclick', () => onSelectDevice(d.id));
      }

      marker.addTo(layer);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    }
  }, [devices, onSelectDevice, pickCoords]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
      style={{ height: `${height}px` }}
      aria-label="Peta lokasi perangkat"
    />
  );
}

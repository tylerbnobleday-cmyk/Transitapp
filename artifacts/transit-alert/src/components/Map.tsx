import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
import { useGetReports } from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react/src/generated/api.schemas";
import { Train, Tram, Bus, MapPin, Layers, Eye, EyeOff, AlertTriangle, Clock, Info } from "lucide-react";

const MELBOURNE_CENTER: [number, number] = [-37.8136, 144.9631];

const TRANSPORT_EMOJI: Record<string, string> = {
  tram: "🚃",
  train: "🚆",
  bus: "🚌",
  stop: "🚏",
};

const REPORT_COLOR: Record<string, string> = {
  inspector: "#e11d48",
  delay: "#f59e0b",
  incident: "#3b82f6",
};

const REPORT_LABEL: Record<string, string> = {
  inspector: "Inspector",
  delay: "Delay",
  incident: "Incident",
};

const DIRECTION_LABEL: Record<string, string> = {
  city_bound: "City Bound 🏙️",
  outbound: "Outbound 🏠",
  unknown: "",
};

function createCustomIcon(report: Report) {
  const emoji = TRANSPORT_EMOJI[report.transportType] ?? "📍";
  const color = REPORT_COLOR[report.reportType] ?? "#6b7280";
  const isInspector = report.reportType === "inspector";

  const html = `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      ${isInspector ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ""}
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${color};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;
        border:2px solid rgba(255,255,255,0.35);
        box-shadow:0 4px 14px rgba(0,0,0,0.6);
        position:relative;z-index:1;
      ">${emoji}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "bg-transparent border-none",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

function LocationCenterer({ loc }: { loc: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (loc) map.setView(loc, 13, { animate: true });
  }, [loc, map]);
  return null;
}

interface LayerState {
  railOverlay: boolean;
  inspectors: boolean;
  delays: boolean;
  incidents: boolean;
  heatCircles: boolean;
}

function LayerControl({
  layers,
  onChange,
}: {
  layers: LayerState;
  onChange: (key: keyof LayerState) => void;
}) {
  const [open, setOpen] = useState(false);

  const controls: { key: keyof LayerState; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "railOverlay", label: "Transit Lines", icon: <Train className="w-3.5 h-3.5" />, color: "#a78bfa" },
    { key: "inspectors", label: "Inspectors", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "#e11d48" },
    { key: "delays", label: "Delays", icon: <Clock className="w-3.5 h-3.5" />, color: "#f59e0b" },
    { key: "incidents", label: "Incidents", icon: <Info className="w-3.5 h-3.5" />, color: "#3b82f6" },
    { key: "heatCircles", label: "Hotspot Glow", icon: <MapPin className="w-3.5 h-3.5" />, color: "#f43f5e" },
  ];

  return (
    <div className="absolute top-20 right-3 z-[1000] flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-full bg-gray-900/90 border border-white/10 shadow-xl flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
        title="Map Layers"
      >
        <Layers className="w-5 h-5" />
      </button>

      {open && (
        <div className="bg-gray-900/95 border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 min-w-[170px]">
          <p className="text-[10px] uppercase tracking-widest text-white/40 px-1 mb-1">Map Layers</p>
          {controls.map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                layers[key]
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              <span style={{ color: layers[key] ? color : undefined }}>{icon}</span>
              <span>{label}</span>
              <span className="ml-auto">
                {layers[key] ? (
                  <Eye className="w-3.5 h-3.5 text-white/50" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-white/20" />
                )}
              </span>
            </button>
          ))}

          <div className="border-t border-white/10 mt-1 pt-2">
            <p className="text-[10px] text-white/30 px-1">Filter by Transport</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap px-1">
              {Object.entries(TRANSPORT_EMOJI).map(([type, emoji]) => (
                <span
                  key={type}
                  title={type}
                  className="text-base cursor-default select-none"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Map() {
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [layers, setLayers] = useState<LayerState>({
    railOverlay: true,
    inspectors: true,
    delays: true,
    incidents: true,
    heatCircles: true,
  });

  const { data: reports = [] } = useGetReports({
    query: { refetchInterval: 30000 },
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
        () => setUserLoc(MELBOURNE_CENTER)
      );
    } else {
      setUserLoc(MELBOURNE_CENTER);
    }
  }, []);

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const visibleReports = reports.filter((r) => {
    if (r.reportType === "inspector" && !layers.inspectors) return false;
    if (r.reportType === "delay" && !layers.delays) return false;
    if (r.reportType === "incident" && !layers.incidents) return false;
    return true;
  });

  const inspectorReports = reports.filter((r) => r.reportType === "inspector" && r.lat && r.lng);

  return (
    <div className="absolute inset-0 z-0">
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15,23,42,0.97) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 16px !important;
          color: white !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: rgba(15,23,42,0.97) !important; }
        .leaflet-container { background: #0f172a; }
        .leaflet-control-zoom { display: none; }
        .leaflet-control-attribution { display: none; }
      `}</style>

      <MapContainer
        center={MELBOURNE_CENTER}
        zoom={13}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "#0f172a" }}
      >
        {/* Base: CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>'
          maxZoom={19}
        />

        {/* Transit Overlay: OpenRailwayMap — shows all train & tram lines for free */}
        {layers.railOverlay && (
          <TileLayer
            url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
            attribution='© <a href="https://openrailwaymap.org">OpenRailwayMap</a>'
            maxZoom={19}
            opacity={0.75}
          />
        )}

        {/* Heatmap circles around inspector clusters */}
        {layers.heatCircles &&
          inspectorReports.map((r) => (
            <Circle
              key={`heat-${r.id}`}
              center={[r.lat!, r.lng!]}
              radius={600}
              pathOptions={{
                color: "transparent",
                fillColor: "#e11d48",
                fillOpacity: 0.12,
              }}
            />
          ))}

        {/* User location */}
        {userLoc && (
          <Circle
            center={userLoc}
            radius={80}
            pathOptions={{
              color: "#60a5fa",
              fillColor: "#3b82f6",
              fillOpacity: 0.7,
              weight: 2,
            }}
          />
        )}

        {userLoc && <LocationCenterer loc={userLoc} />}

        {/* Report pins */}
        {visibleReports.map((report) => {
          if (!report.lat || !report.lng) return null;
          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={createCustomIcon(report)}
            >
              <Popup>
                <div className="p-4 w-64">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <span className="text-2xl">{TRANSPORT_EMOJI[report.transportType]}</span>
                    <div>
                      <p className="font-bold text-white text-sm capitalize">
                        {REPORT_LABEL[report.reportType]}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                      style={{
                        background: REPORT_COLOR[report.reportType] + "33",
                        color: REPORT_COLOR[report.reportType],
                      }}
                    >
                      {report.transportType}
                    </span>
                  </div>

                  {(report.lineNumber || report.direction) && (
                    <div className="flex items-center gap-2 mb-2">
                      {report.lineNumber && (
                        <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-lg">
                          Line {report.lineNumber}
                        </span>
                      )}
                      {report.direction && report.direction !== "unknown" && (
                        <span className="text-xs text-white/60">
                          {DIRECTION_LABEL[report.direction]}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Location</p>
                    <p className="text-sm text-white/90 font-medium">{report.locationName}</p>
                  </div>

                  {report.notes && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-xs text-white/70 italic mb-2">
                      "{report.notes}"
                    </div>
                  )}

                  <p className="text-right text-[10px] text-white/30">
                    by <span className="text-white/50 font-medium">{report.username}</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Layer toggle control */}
      <LayerControl layers={layers} onChange={toggleLayer} />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(10,10,20,0.7)] z-[500]" />
    </div>
  );
}

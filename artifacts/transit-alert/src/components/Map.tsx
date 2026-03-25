import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
import { useGetReports } from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react/src/generated/api.schemas";
import { AlertTriangle, Clock, Info } from "lucide-react";

// CBD Center
const MELBOURNE_CENTER: [number, number] = [-37.8136, 144.9631];

// Auto-center component
function MapCenterer({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

const getTransportEmoji = (type: string) => {
  switch (type) {
    case 'tram': return '🚃';
    case 'train': return '🚆';
    case 'bus': return '🚌';
    case 'stop': return '🚏';
    default: return '📍';
  }
};

const getReportColor = (type: string) => {
  switch (type) {
    case 'inspector': return 'bg-destructive/90 border-destructive shadow-destructive/50';
    case 'delay': return 'bg-warning/90 border-warning shadow-warning/50 text-warning-foreground';
    default: return 'bg-primary/90 border-primary shadow-primary/50';
  }
};

const getReportIcon = (type: string) => {
  switch (type) {
    case 'inspector': return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'delay': return <Clock className="w-4 h-4 text-warning" />;
    default: return <Info className="w-4 h-4 text-primary" />;
  }
};

const createCustomIcon = (report: Report) => {
  const emoji = getTransportEmoji(report.transportType);
  const colorClasses = getReportColor(report.reportType);
  
  // Create a raw HTML string for the Leaflet DivIcon
  // Note: we're using tailwind colors compiled down, so we approximate with hex or use pure CSS classes
  const html = `
    <div class="relative group cursor-pointer">
      <div class="absolute -inset-1 rounded-full opacity-50 animate-ping" style="background-color: ${report.reportType === 'inspector' ? '#f43f5e' : report.reportType === 'delay' ? '#f59e0b' : '#3b82f6'}"></div>
      <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl z-10 relative border-2 border-white/20 shadow-lg" 
           style="background-color: ${report.reportType === 'inspector' ? '#e11d48' : report.reportType === 'delay' ? '#d97706' : '#2563eb'}">
        ${emoji}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'bg-transparent border-none',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

export function Map() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Poll for reports every 30 seconds
  const { data: reports = [] } = useGetReports({
    query: { refetchInterval: 30000 }
  });

  useEffect(() => {
    // Try to get user's real location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Silent fallback to CBD
          setUserLocation(MELBOURNE_CENTER);
        }
      );
    } else {
      setUserLocation(MELBOURNE_CENTER);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-background">
      <MapContainer 
        center={MELBOURNE_CENTER} 
        zoom={14} 
        zoomControl={false}
        className="w-full h-full"
      >
        {/* CartoDB Dark Matter Base Map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        {userLocation && <MapCenterer center={userLocation} />}

        {reports.map((report) => {
          // Add a tiny random offset so pins at the exact same default location don't perfectly overlap
          const lat = (report.lat || MELBOURNE_CENTER[0]) + (Math.random() - 0.5) * 0.005;
          const lng = (report.lng || MELBOURNE_CENTER[1]) + (Math.random() - 0.5) * 0.005;

          return (
            <Marker 
              key={report.id} 
              position={[lat, lng]} 
              icon={createCustomIcon(report)}
            >
              <Popup className="custom-map-popup">
                <div className="p-4 w-64">
                  <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                    {getReportIcon(report.reportType)}
                    <h3 className="font-display font-bold text-lg capitalize tracking-wide text-white">
                      {report.reportType}
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                         {getTransportEmoji(report.transportType)} Mode
                      </span>
                      <span className="font-semibold capitalize text-white">{report.transportType}</span>
                    </div>

                    {(report.lineNumber || report.direction) && (
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground">Line / Dir</span>
                         <span className="font-semibold text-white">
                           {report.lineNumber} {report.lineNumber && report.direction ? '·' : ''} {report.direction !== 'unknown' ? report.direction?.replace('_', ' ') : ''}
                         </span>
                      </div>
                    )}
                    
                    <div className="flex items-start flex-col gap-1 mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Location</span>
                      <span className="font-medium text-sm text-white/90 leading-snug">{report.locationName}</span>
                    </div>

                    {report.notes && (
                      <div className="mt-2 bg-white/5 p-2 rounded-lg text-sm text-white/80 italic border border-white/5">
                        "{report.notes}"
                      </div>
                    )}
                    
                    <div className="mt-3 text-right">
                      <span className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded-full">
                        Reported by <span className="font-medium text-white/80">{report.username}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Vignette overlay to blend map edges into dark UI */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(15,23,42,0.8)] z-[1]" />
    </div>
  );
}

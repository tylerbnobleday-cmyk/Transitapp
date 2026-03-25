import { MessageSquare, MapPin } from "lucide-react";
import { Badge } from "./ui/Badge";
import { useGetReportStats } from "@workspace/api-client-react";

interface TopBarProps {
  onOpenChat: () => void;
}

export function TopBar({ onOpenChat }: TopBarProps) {
  const { data: stats } = useGetReportStats({
    query: { refetchInterval: 60000 }
  });

  const alertsToday = stats?.alertsToday || 0;
  const isHighAlert = alertsToday > 100;

  return (
    <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-40 flex items-start justify-between pointer-events-none">
      {/* Left controls */}
      <div className="flex flex-col gap-4 pointer-events-auto">
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-xl p-2 pr-4 rounded-2xl border border-white/10 shadow-xl shadow-black/50">
          <img 
            src={`${import.meta.env.BASE_URL}images/app-logo.png`} 
            alt="Transit Alert" 
            className="w-10 h-10 rounded-xl"
          />
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-white tracking-tight">TransitAlert</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Melbourne</p>
          </div>
        </div>

        <button 
          onClick={() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(() => {
                // In a real app we'd fly to location via context, for now just a visual button
                window.dispatchEvent(new CustomEvent('recenter-map'));
              });
            }
          }}
          className="w-12 h-12 bg-card/90 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-card hover:scale-105 transition-all shadow-lg active:scale-95"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Right controls */}
      <div className="flex flex-col items-end gap-4 pointer-events-auto">
        <div className="bg-card/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Alerts Today</span>
            <span className="font-display font-bold text-xl text-white leading-none mt-1">{alertsToday}</span>
          </div>
          <Badge variant={isHighAlert ? "destructive" : "default"} className="animate-pulse-slow">
            {isHighAlert ? "High" : "Normal"}
          </Badge>
        </div>

        <button 
          onClick={onOpenChat}
          className="group relative flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-105 transition-all active:scale-95 border border-white/20"
        >
          <MessageSquare className="w-6 h-6 text-primary-foreground relative z-10" />
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
          
          {/* Unread dot */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full border-2 border-primary z-20"></span>
        </button>
      </div>
    </div>
  );
}

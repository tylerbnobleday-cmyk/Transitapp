import { useMemo, useState } from "react";
import { Map, Station, ALL_STATIONS, LINES } from "@/components/Map";
import { TopBar } from "@/components/TopBar";
import { RiskyRoutes } from "@/components/RiskyRoutes";
import { AddReportDrawer } from "@/components/AddReportDrawer";
import { ChatPanel } from "@/components/ChatPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, X, ChevronUp, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useGetTelegramStatus } from "@workspace/api-client-react";

export default function Home() {
  const { data: botStatus } = useGetTelegramStatus();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "telegram" | "fleets" | "admin">("map");
  const [isPlannerOpen, setIsPlannerOpen] = useState(true);
  const [journeyOrigin, setJourneyOrigin] = useState<string>("Flinders Street");
  const [journeyDestination, setJourneyDestination] = useState<string>("Sandringham");
  const [journeyRoute, setJourneyRoute] = useState<Station[]>([]);
  const [journeySummary, setJourneySummary] = useState<string>("Plan a journey using the fields below.");

  const stationOptions = useMemo(
    () => ALL_STATIONS.map((station) => station.name).sort(),
    [],
  );

  const getLineSegment = (stations: Station[], start: string, end: string) => {
    const startIndex = stations.findIndex((station) => station.name === start);
    const endIndex = stations.findIndex((station) => station.name === end);
    if (startIndex === -1 || endIndex === -1) return [];
    return startIndex <= endIndex
      ? stations.slice(startIndex, endIndex + 1)
      : stations.slice(endIndex, startIndex + 1).reverse();
  };

  const computeJourneyRoute = () => {
    const origin = ALL_STATIONS.find((station) => station.name === journeyOrigin);
    const destination = ALL_STATIONS.find((station) => station.name === journeyDestination);
    if (!origin || !destination) {
      setJourneyRoute([]);
      setJourneySummary("Select valid stations to plan a route.");
      return;
    }

    if (origin.name === destination.name) {
      setJourneyRoute([origin]);
      setJourneySummary("You're already at your destination.");
      return;
    }

    const lines = [
      { name: "Frankston", stations: LINES.frankston },
      { name: "Cranbourne", stations: LINES.cranbourne },
      { name: "Pakenham", stations: LINES.pakenham },
      { name: "Sunbury", stations: LINES.sunbury },
      { name: "Metro Tunnel", stations: LINES.metroTunnel },
      { name: "Sandringham", stations: LINES.sandringham },
    ];

    const originLines = lines.filter((line) => line.stations.some((station) => station.name === origin.name));
    const destinationLines = lines.filter((line) => line.stations.some((station) => station.name === destination.name));

    const commonLine = originLines.find((originLine) =>
      destinationLines.some((destLine) => destLine.name === originLine.name),
    );

    if (commonLine) {
      const segment = getLineSegment(commonLine.stations, origin.name, destination.name);
      setJourneyRoute(segment);
      setJourneySummary(`Direct journey via the ${commonLine.name} line (${segment.length} stops).`);
      return;
    }

    const transferStations = ["South Yarra", "Flinders Street", "Southern Cross"];
    let bestRoute: Station[] = [];
    let bestSummary = "No direct connection available.";

    for (const transfer of transferStations) {
      const originLine = originLines.find((line) => line.stations.some((station) => station.name === transfer));
      const destLine = destinationLines.find((line) => line.stations.some((station) => station.name === transfer));
      if (!originLine || !destLine) continue;

      const firstLeg = getLineSegment(originLine.stations, origin.name, transfer);
      const secondLeg = getLineSegment(destLine.stations, transfer, destination.name).slice(1);
      const route = [...firstLeg, ...secondLeg];

      if (!bestRoute.length || route.length < bestRoute.length) {
        bestRoute = route;
        bestSummary = `Change at ${transfer} from ${originLine.name} line to ${destLine.name} line (${route.length} stops).`;
      }
    }

    if (bestRoute.length) {
      setJourneyRoute(bestRoute);
      setJourneySummary(bestSummary);
      return;
    }

    setJourneyRoute([origin, destination]);
    setJourneySummary("Fallback route: start and end markers shown, with no route connection found.");
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      {/* UI Overlays */}
      <TopBar onOpenChat={() => setIsChatOpen(true)} />

      <div className="absolute top-28 left-0 right-0 px-4 sm:px-6 z-40">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="max-w-5xl mx-auto bg-card/75 backdrop-blur-xl border border-white/10 shadow-xl p-1">
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
            <TabsTrigger value="fleets">Fleets</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <div className="max-w-5xl mx-auto mt-4 rounded-3xl border border-white/10 bg-card/80 p-5 shadow-2xl backdrop-blur-xl text-white">
            <TabsContent value="map">
              {isPlannerOpen && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl max-w-3xl mx-auto relative">
                <button
                  onClick={() => setIsPlannerOpen(false)}
                  className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition"
                  title="Close planner"
                >
                  <X className="w-5 h-5 text-white/70 hover:text-white" />
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <label className="flex flex-col text-sm text-white/80">
                      Where to?
                      <input
                        value={journeyDestination}
                        onChange={(event) => setJourneyDestination(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            computeJourneyRoute();
                          }
                        }}
                        list="station-options"
                        placeholder="Search station name..."
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-background/70 p-3 text-sm text-white outline-none focus:border-primary"
                      />
                      <datalist id="station-options">
                        {stationOptions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </label>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 sm:max-w-xs">
                    <label className="flex flex-col text-sm text-white/80">
                      From
                      <select
                        value={journeyOrigin}
                        onChange={(event) => setJourneyOrigin(event.target.value)}
                        className="mt-2 rounded-2xl border border-white/10 bg-background/70 p-3 text-sm text-white outline-none focus:border-primary"
                      >
                        {stationOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </label>

                    <button
                      onClick={computeJourneyRoute}
                      className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition"
                    >
                      Plan route
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl bg-slate-900/80 p-3 border border-white/10 text-sm text-white/80">
                  <p className="font-semibold text-white">{journeyRoute.length > 0 ? "Route summary" : "Enter a destination to plan a route"}</p>
                  <p className="mt-2 text-sm">{journeySummary}</p>
                  {journeyRoute.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {journeyRoute.map((station, index) => (
                        <div key={`${station.name}-${index}`} className="flex items-center gap-2">
                          <span className="w-5 text-right text-white/70">{index + 1}.</span>
                          <span>{station.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}
              {!isPlannerOpen && (
                <button
                  onClick={() => setIsPlannerOpen(true)}
                  className="mx-auto flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  <ChevronUp className="w-4 h-4" />
                  Show Planner
                </button>
              )}
            </TabsContent>
            <TabsContent value="telegram">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Telegram Bot Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect with our Telegram bot to receive real-time notifications and report sightings directly from your phone.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Bot status</p>
                      {botStatus?.connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {botStatus?.connected 
                        ? `Connected as @${botStatus.username}` 
                        : "Bot not configured. Set TELEGRAM_BOT_TOKEN in environment."}
                    </p>
                    {botStatus?.connected && (
                      <a 
                        href={`https://t.me/${botStatus.username}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                      >
                        Open in Telegram <Send className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Usage Instructions</p>
                    <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside flex flex-col gap-1">
                      <li>Use <code className="text-white/80">/status</code> to get current transit info</li>
                      <li>Use <code className="text-white/80">/report &lt;details&gt;</code> to log a sighting</li>
                      <li>Add the bot to a channel to receive alerts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="fleets">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Fleet Tracking</h2>
                <p className="text-sm text-muted-foreground">
                  Track specific fleets, vehicles, or routes in real time.
                  This panel can later show active fleet status, ETA, and location history.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Example Fleet</p>
                    <p className="text-xs text-muted-foreground mt-1">Tram 96, Train X, Bus 250</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Tracking mode</p>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting integration</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="admin">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Alerts Admin</h2>
                <p className="text-sm text-muted-foreground">
                  Administration tools for managing incoming alerts, user reports, and system settings.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Manage alerts</p>
                    <p className="text-xs text-muted-foreground mt-1">Review, approve, or dismiss reports.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Admin tools</p>
                    <p className="text-xs text-muted-foreground mt-1">Configure notifications, users, and fleet rules.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {activeTab === "map" && <RiskyRoutes />}

      <Map journeyRoute={journeyRoute} />

      {/* Floating Add Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold shadow-[0_10px_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="bg-black text-white rounded-full p-1 group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-lg tracking-tight">Add a Report</span>
        </button>
      </div>

      {/* Modals & Panels */}
      <AddReportDrawer 
        isOpen={isAddDrawerOpen} 
        onClose={() => setIsAddDrawerOpen(false)} 
      />
      
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </main>
  );
}

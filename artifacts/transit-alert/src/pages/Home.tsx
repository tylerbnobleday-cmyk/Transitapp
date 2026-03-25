import { useState } from "react";
import { Map } from "@/components/Map";
import { TopBar } from "@/components/TopBar";
import { RiskyRoutes } from "@/components/RiskyRoutes";
import { AddReportDrawer } from "@/components/AddReportDrawer";
import { ChatPanel } from "@/components/ChatPanel";
import { Plus } from "lucide-react";

export default function Home() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      {/* Background Map layer */}
      <Map />
      
      {/* UI Overlays */}
      <TopBar onOpenChat={() => setIsChatOpen(true)} />
      
      <RiskyRoutes />

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

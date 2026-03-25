import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MapPin, Search } from "lucide-react";
import { useCreateReport } from "@workspace/api-client-react";
import type { CreateReportInput } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface AddReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddReportDrawer({ isOpen, onClose }: AddReportDrawerProps) {
  const queryClient = useQueryClient();
  const { mutate: createReport, isPending } = useCreateReport({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/stats"] });
        onClose();
        resetForm();
      }
    }
  });

  const [formData, setFormData] = useState<Partial<CreateReportInput>>({
    reportType: "inspector",
    transportType: "tram",
    direction: "unknown",
    username: "Guest_" + Math.floor(Math.random() * 1000)
  });

  const resetForm = () => {
    setFormData({
      reportType: "inspector",
      transportType: "tram",
      direction: "unknown",
      username: "Guest_" + Math.floor(Math.random() * 1000),
      lineNumber: "",
      locationName: "",
      notes: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationName) return; // basic validation
    
    // Fallback coords for demo if needed
    createReport({
      data: formData as CreateReportInput
    });
  };

  const updateField = (field: keyof CreateReportInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col"
          >
            <div className="p-4 flex justify-center shrink-0">
              <div className="w-16 h-1.5 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 pb-4 flex items-center justify-between shrink-0 border-b border-white/5">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Add a Report</h2>
                <p className="text-sm text-muted-foreground">Help the community stay alert.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 scrollbar-hide">
              <form id="report-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-20">
                
                {/* 1. Report Type */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1. What did you see?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'inspector', label: 'Inspector', icon: '🕵️', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
                      { id: 'delay', label: 'Delay', icon: '⏳', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
                      { id: 'incident', label: 'Incident', icon: '🚨', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateField('reportType', type.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all",
                          formData.reportType === type.id 
                            ? `${type.bg} ${type.color} ring-2 ring-current ring-offset-2 ring-offset-card shadow-lg` 
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span className="text-3xl mb-2">{type.icon}</span>
                        <span className="font-medium text-sm">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Transport Type */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">2. Mode of Transport</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'tram', label: 'Tram', icon: '🚃' },
                      { id: 'train', label: 'Train', icon: '🚆' },
                      { id: 'bus', label: 'Bus', icon: '🚌' },
                      { id: 'stop', label: 'Stop', icon: '🚏' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateField('transportType', type.id)}
                        className={cn(
                          "flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all",
                          formData.transportType === type.id 
                            ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        )}
                      >
                        <span className="text-2xl mb-1">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 3. Line Number */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">3. Route / Line</label>
                    <input 
                      type="text"
                      placeholder="e.g. 19, Frankston, 246"
                      value={formData.lineNumber || ''}
                      onChange={e => updateField('lineNumber', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  {/* 4. Direction */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">4. Direction</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'city_bound', label: 'City Bound 🏙️' },
                        { id: 'outbound', label: 'Outbound 🏠' }
                      ].map(dir => (
                        <button
                          key={dir.id}
                          type="button"
                          onClick={() => updateField('direction', formData.direction === dir.id ? 'unknown' : dir.id)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                            formData.direction === dir.id 
                              ? "bg-white text-black border-white shadow-lg" 
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          )}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Location */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">5. Where?</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input 
                      required
                      type="text"
                      placeholder="Stop name, station, or cross street..."
                      value={formData.locationName || ''}
                      onChange={e => updateField('locationName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* 6. Notes */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Extra details (optional)</label>
                  <textarea 
                    placeholder="e.g. Front carriage, 3 officers..."
                    rows={2}
                    value={formData.notes || ''}
                    onChange={e => updateField('notes', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  />
                </div>

              </form>
            </div>
            
            {/* Sticky bottom actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-card via-card to-transparent pt-12 flex gap-4 max-w-2xl mx-auto w-full">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                form="report-form"
                type="submit"
                disabled={isPending || !formData.locationName}
                className="flex-[2] py-4 rounded-2xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

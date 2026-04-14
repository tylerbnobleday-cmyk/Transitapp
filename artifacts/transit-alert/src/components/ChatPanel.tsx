import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { useGetChatMessages, useSendChatMessage } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [username] = useState("User_" + Math.floor(Math.random() * 9999));

  const { data } = useGetChatMessages({
    query: { refetchInterval: 10000 }
  });

  const messages = Array.isArray(data) ? data : [];

  const { mutate: sendMessage, isPending } = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
        setMessage("");
      }
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage({ data: { message, username } });
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 right-0 w-full md:w-[400px] z-50 bg-card border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white leading-none">Alert Talk</h2>
                  <p className="text-xs text-green-400 font-medium flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Community
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent to-black/20"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageCircle className="w-12 h-12 mb-3" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.username === username;
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 ml-1">
                        {isMe ? 'You' : msg.username} • {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
                          : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-card">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Type an alert or question..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary focus:bg-white/10 transition-all"
                />
                <button 
                  type="submit"
                  disabled={isPending || !message.trim()}
                  className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-transform active:scale-95 shadow-lg"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

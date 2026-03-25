import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center border border-destructive/30 shadow-[0_0_30px_rgba(225,29,72,0.3)]">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold tracking-tight">Detour Ahead</h1>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link 
          href="/" 
          className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Back to Map
        </Link>
      </div>
    </div>
  );
}

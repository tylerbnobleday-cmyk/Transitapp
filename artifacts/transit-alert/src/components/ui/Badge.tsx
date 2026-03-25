import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary/20 text-primary border border-primary/30": variant === "default",
          "bg-destructive/20 text-destructive border border-destructive/30 shadow-[0_0_10px_rgba(225,29,72,0.3)]": variant === "destructive",
          "bg-warning/20 text-warning border border-warning/30": variant === "warning",
          "bg-green-500/20 text-green-400 border border-green-500/30": variant === "success",
          "border border-border text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

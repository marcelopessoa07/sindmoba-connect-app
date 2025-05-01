
import * as React from "react";
import { cn } from "@/lib/utils";

interface NotificationDotProps {
  className?: string;
  pulse?: boolean;
}

export function NotificationDot({ className, pulse = false }: NotificationDotProps) {
  return (
    <span 
      className={cn(
        "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500", 
        pulse && "animate-pulse",
        className
      )} 
      aria-hidden="true"
    />
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

// Plain <select> styled to match shadcn inputs. Works directly with form actions.
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input bg-transparent dark:bg-input/30 h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

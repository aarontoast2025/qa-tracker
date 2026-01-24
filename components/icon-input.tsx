import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon, ChevronDown } from "lucide-react";

interface IconInputProps extends React.ComponentProps<"input"> {
  label: string;
  icon: LucideIcon;
  containerClassName?: string;
  list?: string;
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, containerClassName, label, icon: Icon, id, list, type, ...props }, ref) => {
    return (
      <div className={cn("grid gap-2", containerClassName)}>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative group">
          {/* Left Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary z-10 pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
          
          <Input
            id={id}
            type={type}
            className={cn(
              "pl-9", 
              // Hide ALL native browser indicators for fields with a suggestion list
              list && [
                "pr-9",
                "[&::-webkit-calendar-picker-indicator]:!hidden",
                "[&::-webkit-calendar-picker-indicator]:!opacity-0",
                "[&::-webkit-list-button]:!hidden",
                "[&::-webkit-inner-spin-button]:!hidden",
                "[&::-webkit-outer-spin-button]:!hidden",
                "appearance-none"
              ],
              // For standard date inputs, we keep the native indicator (calendar icon)
              // but we ensure it's not being hidden by the 'list' logic above.
              className
            )}
            ref={ref}
            list={list}
            {...props}
          />

          {/* Right Icon (Lined Arrow) - Visible ONLY for fields with suggestions */}
          {list && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none transition-colors group-focus-within:text-primary">
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    );
  },
);
IconInput.displayName = "IconInput";

export { IconInput };

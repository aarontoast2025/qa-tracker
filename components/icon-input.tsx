import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface IconInputProps extends React.ComponentProps<"input"> {
  label: string;
  icon: LucideIcon;
  containerClassName?: string;
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, containerClassName, label, icon: Icon, id, ...props }, ref) => {
    return (
      <div className={cn("grid gap-2", containerClassName)}>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <Input
            id={id}
            className={cn("pl-9", className)}
            ref={ref}
            {...props}
          />
        </div>
      </div>
    );
  },
);
IconInput.displayName = "IconInput";

export { IconInput };

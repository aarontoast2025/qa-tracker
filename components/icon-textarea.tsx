import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface IconTextareaProps extends React.ComponentProps<"textarea"> {
  label: string;
  icon: LucideIcon;
  containerClassName?: string;
}

const IconTextarea = React.forwardRef<HTMLTextAreaElement, IconTextareaProps>(
  ({ className, containerClassName, label, icon: Icon, id, ...props }, ref) => {
    return (
      <div className={cn("grid gap-2", containerClassName)}>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <Textarea
            id={id}
            className={cn("pl-10 pr-10 min-h-[100px] resize-none", className)}
            ref={ref}
            {...props}
          />
        </div>
      </div>
    );
  },
);
IconTextarea.displayName = "IconTextarea";

export { IconTextarea };

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon, ChevronDown, Check } from "lucide-react";

interface AutocompleteInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label: string;
  icon: LucideIcon;
  options: string[];
  containerClassName?: string;
  onChange: (value: string) => void;
  value: string;
}

const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ className, containerClassName, label, icon: Icon, id, options, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filteredOptions, setFilteredOptions] = React.useState<string[]>(options);
    const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Filter options when value changes
    React.useEffect(() => {
      const filtered = options.filter(option => 
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    }, [value, options]);

    // Update position
    const updatePosition = React.useCallback(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // We use fixed positioning relative to viewport
        setPosition({
          top: rect.bottom + 6, // add a small gap
          left: rect.left,
          width: rect.width
        });
      }
    }, []);

    // Handle outside click to close
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current && 
          !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Handle Scroll/Resize to update position or close
    React.useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            // Close on scroll to avoid detached floating element issues (simple fix)
            const handleScroll = (event: Event) => {
               // Ignore scroll events from inside the dropdown
               if (dropdownRef.current && event.target instanceof Node && dropdownRef.current.contains(event.target)) {
                   return;
               }
               setIsOpen(false);
            };
            window.addEventListener('scroll', handleScroll, { capture: true });
            
            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', handleScroll, { capture: true });
            };
        }
    }, [isOpen, updatePosition]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setIsOpen(true);
    };

    const handleOptionClick = (option: string) => {
      onChange(option);
      setIsOpen(false);
    };

    const handleInputFocus = () => {
      updatePosition();
      setIsOpen(true);
    };

    return (
      <div className={cn("grid gap-2 relative", containerClassName)} ref={containerRef}>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative group">
          {/* Left Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary z-10 pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
          
          <Input
            id={id}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            autoComplete="off"
            className={cn(
              "pl-9 pr-9", 
              className
            )}
            ref={ref}
            {...props}
          />

          {/* Right Icon (Lined Arrow) */}
          <div 
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => {
                if (!isOpen) updatePosition();
                setIsOpen(!isOpen);
            }}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>

        {/* Portal Dropdown */}
        {isOpen && filteredOptions.length > 0 && typeof document !== 'undefined' && createPortal(
          <div 
            ref={dropdownRef}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: '200px',
                zIndex: 9999,
                pointerEvents: 'auto'
            }}
            className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          >
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleOptionClick(option)}
                >
                  {value === option && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <span className={cn("ml-6 block truncate", value !== option && "ml-2")}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  },
);
AutocompleteInput.displayName = "AutocompleteInput";

export { AutocompleteInput };
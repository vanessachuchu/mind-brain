import * as React from "react";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string; // ISO string format: 2024-08-16T09:00
  onValueChange?: (value: string) => void;
}

const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ className, value, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onValueChange?.(newValue);
      onChange?.(e);
    };

    return (
      <input
        type="datetime-local"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
DateTimePicker.displayName = "DateTimePicker";

export { DateTimePicker };
import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate";

type CheckboxProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
};

function nextCheckedState(current: CheckedState): CheckedState {
  if (current === "indeterminate") return true;
  return !current;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, defaultChecked = false, onCheckedChange, disabled, onClick, onKeyDown, ...props }, ref) => {
    const isControlled = checked !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState<CheckedState>(defaultChecked);
    const state: CheckedState = isControlled ? checked : uncontrolled;

    const dataState = state === "indeterminate" ? "indeterminate" : state ? "checked" : "unchecked";
    const ariaChecked: React.AriaAttributes["aria-checked"] = state === "indeterminate" ? "mixed" : !!state;

    const commit = (next: CheckedState) => {
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    const toggle = () => {
      commit(nextCheckedState(state));
    };

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={ariaChecked}
        data-state={dataState}
        disabled={disabled}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || disabled) return;
          toggle();
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented || disabled) return;
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle();
          }
        }}
        {...props}
      >
        <span className={cn("flex items-center justify-center text-current")}>
          {dataState !== "unchecked" ? <Check className="h-4 w-4" /> : null}
        </span>
      </button>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

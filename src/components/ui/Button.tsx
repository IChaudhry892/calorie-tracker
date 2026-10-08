import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  // Dark text: white on accent-secondary is only 2.9:1, the background colour is 4.7:1 (WCAG AA).
  primary: "bg-accent-secondary text-background hover:bg-accent",
  secondary: "border-2 border-accent text-accent hover:text-accent-hover",
  ghost: "text-foreground/80 hover:text-accent-hover",
  danger: "border-2 border-red-300/60 text-red-300 hover:border-red-300",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
};

export type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

/** Class string for links that should look like buttons. */
export function buttonClasses({ variant = "primary", size = "md" }: { variant?: Variant; size?: Size } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export function Button({ variant, size, type = "button", className = "", ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClasses({ variant, size })} ${className}`} {...props} />;
}

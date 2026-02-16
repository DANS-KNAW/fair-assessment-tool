import type { Child } from "hono/jsx";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  href?: string;
  variant?: ButtonVariant;
  children: Child;
  class?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-600",
  secondary:
    "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

export function Button({
  type = "button",
  href,
  variant = "primary",
  children,
  class: className = "",
}: ButtonProps) {
  const baseClasses =
    "rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} class={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} class={classes}>
      {children}
    </button>
  );
}

type BadgeVariant = "admin" | "trainer" | "default";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  admin: "bg-primary-50 text-primary-700 ring-primary-600/20",
  trainer: "bg-green-50 text-green-700 ring-green-600/20",
  default: "bg-gray-50 text-gray-600 ring-gray-500/10",
};

export function Badge({ text, variant = "default" }: BadgeProps) {
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${variantClasses[variant]}`}
    >
      {text}
    </span>
  );
}

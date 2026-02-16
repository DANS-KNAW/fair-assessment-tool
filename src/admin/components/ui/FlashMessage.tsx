type FlashVariant = "success" | "error";

interface FlashMessageProps {
  message: string;
  variant?: FlashVariant;
}

const variantClasses: Record<FlashVariant, string> = {
  success: "bg-green-50 text-green-800 border-green-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export function FlashMessage({
  message,
  variant = "error",
}: FlashMessageProps) {
  return (
    <div
      class={`rounded-md border p-4 text-sm ${variantClasses[variant]}`}
      role="alert"
    >
      {message}
    </div>
  );
}

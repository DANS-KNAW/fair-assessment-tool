import type { Child } from "hono/jsx";

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  children: Child;
}

export function FormField({ label, name, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        for={name}
        class="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <div class="mt-2">{children}</div>
      {error && <p class="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

import type { Child } from "hono/jsx";

interface NavGroupProps {
  heading?: string;
  children: Child;
}

export function NavGroup({ heading, children }: NavGroupProps) {
  return (
    <li>
      {heading && (
        <div class="text-xs font-semibold leading-6 text-gray-400">
          {heading}
        </div>
      )}
      <ul class="-mx-2 space-y-1">{children}</ul>
    </li>
  );
}

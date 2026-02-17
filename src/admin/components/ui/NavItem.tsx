import type { Child } from "hono/jsx";

interface NavItemProps {
  href: string;
  label: string;
  icon: Child;
  current?: boolean;
}

export function NavItem({ href, label, icon, current = false }: NavItemProps) {
  const baseClasses =
    "cursor-pointer group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6";
  const activeClasses = current
    ? "bg-gray-50 text-primary-600"
    : "text-gray-700 hover:bg-gray-50 hover:text-primary-600";

  return (
    <li>
      <a href={href} class={`${baseClasses} ${activeClasses}`}>
        <span
          class={`size-6 shrink-0 ${current ? "text-primary-600" : "text-gray-400 group-hover:text-primary-600"}`}
        >
          {icon}
        </span>
        {label}
      </a>
    </li>
  );
}

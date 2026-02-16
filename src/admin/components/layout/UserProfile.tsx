import type { AdminUser } from "../../types.js";
import { Badge } from "../ui/Badge.js";
import { ArrowRightStartOnRectangleIcon } from "../ui/Icon.js";

interface UserProfileProps {
  user: AdminUser;
}

export function UserProfile({ user }: UserProfileProps) {
  const displayName = user.name ?? user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <li class="-mx-6 mt-auto border-t border-gray-200">
      <div class="flex items-center gap-x-3 px-6 py-4">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
          {initial}
        </span>
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm font-semibold text-gray-900">
            {displayName}
          </span>
          <Badge
            text={user.role}
            variant={user.role === "admin" ? "admin" : "trainer"}
          />
        </span>
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Sign out"
          >
            <ArrowRightStartOnRectangleIcon class="size-5" />
            <span class="sr-only">Sign out</span>
          </button>
        </form>
      </div>
    </li>
  );
}

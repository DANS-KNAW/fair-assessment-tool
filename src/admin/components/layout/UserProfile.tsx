import type { AdminUser } from "../../types.js";
import { ArrowRightStartOnRectangleIcon } from "../ui/Icon.js";

interface UserProfileProps {
  user: AdminUser;
}

export function UserProfile({ user }: UserProfileProps) {
  const displayName = user.name ?? user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <li class="mt-auto border-t border-gray-200 pt-4 pb-2">
      {/* User info */}
      <div class="-mx-2 flex items-center gap-x-3 rounded-md p-2">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {initial}
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="truncate text-sm font-semibold text-gray-900">
            {displayName}
          </span>
          <span class="text-xs text-gray-400">{user.role}</span>
        </span>
      </div>
      {/* Sign out */}
      <form action="/admin/logout" method="post">
        <button
          type="submit"
          class="group -mx-2 mt-1 flex w-full cursor-pointer gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary-600"
        >
          <ArrowRightStartOnRectangleIcon class="size-6 shrink-0 text-gray-400 group-hover:text-primary-600" />
          Sign out
        </button>
      </form>
    </li>
  );
}

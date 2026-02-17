import type { AdminUser } from "../../types.js";
import {
  ChartPieIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from "../ui/Icon.js";
import { NavItem } from "../ui/NavItem.js";
import { NavGroup } from "./NavGroup.js";
import { UserProfile } from "./UserProfile.js";

interface SidebarProps {
  user: AdminUser;
  currentPath: string;
}

export function Sidebar({ user, currentPath }: SidebarProps) {
  return (
    <div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div class="flex h-16 shrink-0 items-center">
        <span class="text-xl font-bold text-primary-600">FAIR-Aware</span>
      </div>
      <nav class="flex flex-1 flex-col">
        <ul class="flex flex-1 flex-col gap-y-7">
          <NavGroup>
            <NavItem
              href="/admin"
              label="Dashboard"
              icon={<ChartPieIcon class="size-6" />}
              current={currentPath === "/admin" || currentPath === "/admin/"}
            />
            <NavItem
              href="/admin/course-codes"
              label="Course Codes"
              icon={<ClipboardDocumentListIcon class="size-6" />}
              current={currentPath.startsWith("/admin/course-codes")}
            />
            {user.role === "admin" && (
              <NavItem
                href="/admin/users"
                label="Users"
                icon={<UsersIcon class="size-6" />}
                current={currentPath.startsWith("/admin/users")}
              />
            )}
          </NavGroup>
          <UserProfile user={user} />
        </ul>
      </nav>
    </div>
  );
}

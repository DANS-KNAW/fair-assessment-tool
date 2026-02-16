import type { AdminUser } from "../../types.js";
import { XMarkIcon } from "../ui/Icon.js";
import { Sidebar } from "./Sidebar.js";

interface MobileSidebarProps {
  user: AdminUser;
  currentPath: string;
}

export function MobileSidebar({ user, currentPath }: MobileSidebarProps) {
  return (
    <div id="mobile-sidebar-container" class="relative z-50 lg:hidden hidden">
      {/* Backdrop */}
      <div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-gray-900/80" />
      <div class="fixed inset-0 flex">
        <div class="relative mr-16 flex w-full max-w-xs flex-1">
          {/* Close button */}
          <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button
              type="button"
              id="mobile-sidebar-close"
              class="-m-2.5 p-2.5"
            >
              <span class="sr-only">Close sidebar</span>
              <XMarkIcon class="size-6 text-white" />
            </button>
          </div>
          <Sidebar user={user} currentPath={currentPath} />
        </div>
      </div>
    </div>
  );
}

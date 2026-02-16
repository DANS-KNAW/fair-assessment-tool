import { Bars3Icon } from "../ui/Icon.js";

export function MobileTopBar() {
  return (
    <div class="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
      <button
        type="button"
        id="mobile-sidebar-open"
        class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
      >
        <span class="sr-only">Open sidebar</span>
        <Bars3Icon class="size-6" />
      </button>
      <div class="flex-1 text-sm font-semibold leading-6 text-gray-900">
        FAIR-Aware
      </div>
    </div>
  );
}

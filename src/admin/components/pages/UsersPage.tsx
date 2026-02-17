import type { AdminUser } from "../../types.js";
import { AdminLayout } from "../layout/AdminLayout.js";

interface UsersPageProps {
  user: AdminUser;
  currentPath: string;
}

export function UsersPage({ user, currentPath }: UsersPageProps) {
  return (
    <AdminLayout title="Users" user={user} currentPath={currentPath}>
      <div class="mb-8">
        <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Users
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          Manage admin and trainer accounts.
        </p>
      </div>
      <div class="rounded-md border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        User management coming soon.
      </div>
    </AdminLayout>
  );
}

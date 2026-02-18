import type { Pool } from "mysql2/promise";
import { getAllUsers } from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import { AdminLayout } from "../layout/AdminLayout.js";
import { Button } from "../ui/Button.js";
import { FlashMessage } from "../ui/FlashMessage.js";

interface UsersPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
  flash?: string;
  flashVariant?: "success" | "error";
}

export async function UsersPage({
  pool,
  user,
  currentPath,
  flash,
  flashVariant,
}: UsersPageProps) {
  const users = await getAllUsers(pool);

  return (
    <AdminLayout title="Users" user={user} currentPath={currentPath}>
      {/* Header */}
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Users
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Manage admin and trainer accounts.
          </p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button id="create-modal-open" variant="primary">
            Create User
          </Button>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div class="mb-6">
          <FlashMessage message={flash} variant={flashVariant} />
        </div>
      )}

      {/* Table */}
      <div class="mt-8 overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="w-8 py-3.5 pl-4 sm:pl-6">
                <span class="sr-only">Session</span>
              </th>
              <th
                scope="col"
                class="py-3.5 pl-2 pr-3 text-left text-sm font-semibold text-gray-900"
              >
                Name
              </th>
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Email
              </th>
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Role
              </th>
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Last Login
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colspan={7} class="py-4 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 sm:pl-6">
                    <span
                      class={`inline-block size-2 cursor-pointer rounded-full ${u.has_active_session ? "bg-green-500" : "bg-gray-300"}`}
                      title={
                        u.has_active_session
                          ? "Active session"
                          : "No active session"
                      }
                    />
                  </td>
                  <td class="whitespace-nowrap py-4 pl-2 pr-3 text-sm font-medium">
                    <a
                      href={`/admin/users/${encodeURIComponent(u.id)}`}
                      class="text-primary-600 hover:text-primary-500"
                    >
                      {u.name || "\u2014"}
                    </a>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {u.email}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <RoleBadge role={u.role} />
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <StatusBadge status={u.status} />
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString("en-GB")
                      : "\u2014"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal backdrop */}
      <div
        id="create-modal-backdrop"
        class="fixed inset-0 z-40 hidden bg-gray-900/80"
      />

      {/* Create modal */}
      <div id="create-modal" class="fixed inset-0 z-50 hidden">
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900">Create User</h3>
            <form action="/admin/users" method="post" class="mt-4 space-y-4">
              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="user@example.com"
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                />
              </div>
              <div>
                <label
                  for="firstName"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="Jane"
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                />
              </div>
              <div>
                <label
                  for="lastName"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Doe"
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                />
              </div>
              <fieldset>
                <legend class="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </legend>
                <div class="space-y-2">
                  <label class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none has-[:checked]:border-primary-600 has-[:checked]:ring-2 has-[:checked]:ring-primary-600">
                    <input
                      type="radio"
                      name="role"
                      value="trainer"
                      checked
                      class="sr-only"
                    />
                    <span class="flex flex-1 flex-col">
                      <span class="block text-sm font-medium text-gray-900">
                        Trainer
                      </span>
                      <span class="mt-1 text-sm text-gray-500">
                        Can create course codes and view their own assessment
                        data
                      </span>
                    </span>
                  </label>
                  <label class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none has-[:checked]:border-primary-600 has-[:checked]:ring-2 has-[:checked]:ring-primary-600">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      class="sr-only"
                    />
                    <span class="flex flex-1 flex-col">
                      <span class="block text-sm font-medium text-gray-900">
                        Admin
                      </span>
                      <span class="mt-1 text-sm text-gray-500">
                        Full access to all data, user management, and system
                        settings
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
              <div class="flex justify-end gap-x-3">
                <Button type="button" variant="secondary" class="modal-cancel">
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Safe: static inline script with no user input */}
      <script
        dangerouslySetInnerHTML={{
          __html: [
            "(function() {",
            "  var modal = document.getElementById('create-modal');",
            "  var backdrop = document.getElementById('create-modal-backdrop');",
            "  var openBtn = document.getElementById('create-modal-open');",
            "  var cancelBtns = document.querySelectorAll('.modal-cancel');",
            "  function openModal() { modal.classList.remove('hidden'); backdrop.classList.remove('hidden'); }",
            "  function closeModal() { modal.classList.add('hidden'); backdrop.classList.add('hidden'); }",
            "  if (openBtn) openBtn.addEventListener('click', openModal);",
            "  if (backdrop) backdrop.addEventListener('click', closeModal);",
            "  cancelBtns.forEach(function(btn) { btn.addEventListener('click', closeModal); });",
            "  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });",
            "})();",
          ].join("\n"),
        }}
      />
    </AdminLayout>
  );
}

// ── Local helpers ──

function RoleBadge({ role }: { role: "admin" | "trainer" }) {
  const colors =
    role === "admin"
      ? "bg-purple-50 text-purple-700 ring-purple-700/10"
      : "bg-blue-50 text-blue-700 ring-blue-700/10";
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: "active" | "pending" | "disabled";
}) {
  const colorMap: Record<string, string> = {
    active: "bg-green-50 text-green-700 ring-green-600/20",
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    disabled: "bg-gray-50 text-gray-600 ring-gray-500/10",
  };
  const colors = colorMap[status] ?? colorMap.disabled;
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors}`}
    >
      {status}
    </span>
  );
}

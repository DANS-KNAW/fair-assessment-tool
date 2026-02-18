import type { Pool } from "mysql2/promise";
import {
  getUserById,
  getUserCourseCodesWithCounts,
  hasActiveSession,
} from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import { AdminLayout } from "../layout/AdminLayout.js";
import { Button } from "../ui/Button.js";
import { FlashMessage } from "../ui/FlashMessage.js";

interface UserDetailPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
  targetUserId: string;
  flash?: string;
  flashVariant?: "success" | "error";
}

export async function UserDetailPage({
  pool,
  user,
  currentPath,
  targetUserId,
  flash,
  flashVariant,
}: UserDetailPageProps) {
  const [targetUser, courseCodes, activeSession] = await Promise.all([
    getUserById(pool, targetUserId),
    getUserCourseCodesWithCounts(pool, targetUserId),
    hasActiveSession(pool, targetUserId),
  ]);

  if (!targetUser) {
    return (
      <AdminLayout title="User Not Found" user={user} currentPath={currentPath}>
        <div class="mb-4">
          <a
            href="/admin/users"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            &larr; Back to Users
          </a>
        </div>
        <p class="text-sm text-gray-500">User not found.</p>
      </AdminLayout>
    );
  }

  const isSelf = user.id === targetUser.id;

  const roleBadgeColors =
    targetUser.role === "admin"
      ? "bg-purple-50 text-purple-700 ring-purple-700/10"
      : "bg-blue-50 text-blue-700 ring-blue-700/10";

  const statusBadgeColors =
    targetUser.status === "active"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : targetUser.status === "pending"
        ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
        : "bg-gray-50 text-gray-600 ring-gray-500/10";

  return (
    <AdminLayout
      title={targetUser.name || targetUser.email}
      user={user}
      currentPath={currentPath}
    >
      {/* Back link */}
      <div class="mb-4">
        <a
          href="/admin/users"
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          &larr; Back to Users
        </a>
      </div>

      {/* Flash message */}
      {flash && (
        <div class="mb-6">
          <FlashMessage message={flash} variant={flashVariant} />
        </div>
      )}

      {/* Header + Actions */}
      <div class="mb-8 sm:flex sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {targetUser.name || targetUser.email}
          </h1>
          <p class="mt-1 text-sm text-gray-500">{targetUser.email}</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-4">
          {isSelf ? (
            <p class="text-sm text-gray-500">
              You cannot modify your own account.
            </p>
          ) : (
            <div class="flex gap-x-3">
              {targetUser.status === "pending" && (
                <>
                  <Button id="copy-invite-btn" variant="primary">
                    Copy Invite Link
                  </Button>
                  <Button id="delete-modal-open" variant="danger">
                    Delete
                  </Button>
                </>
              )}
              {targetUser.status === "active" && (
                <>
                  <form
                    action={`/admin/users/${targetUser.id}/disable`}
                    method="post"
                    class="inline"
                  >
                    <Button type="submit" variant="secondary">
                      Disable
                    </Button>
                  </form>
                  {activeSession && (
                    <form
                      action={`/admin/users/${targetUser.id}/force-logout`}
                      method="post"
                      class="inline"
                    >
                      <Button type="submit" variant="secondary">
                        Force Logout
                      </Button>
                    </form>
                  )}
                  <Button id="delete-modal-open" variant="danger">
                    Delete
                  </Button>
                </>
              )}
              {targetUser.status === "disabled" && (
                <>
                  <form
                    action={`/admin/users/${targetUser.id}/enable`}
                    method="post"
                    class="inline"
                  >
                    <Button type="submit" variant="secondary">
                      Enable
                    </Button>
                  </form>
                  <Button id="delete-modal-open" variant="danger">
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User info */}
      <div class="mt-8">
        <h2 class="text-lg font-medium text-gray-900">User Information</h2>
        <div class="mt-4">
          <dl class="divide-y divide-gray-100">
            <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt class="text-sm font-medium text-gray-900">Role</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                <span
                  class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${roleBadgeColors}`}
                >
                  {targetUser.role}
                </span>
              </dd>
            </div>
            <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt class="text-sm font-medium text-gray-900">Status</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                <span
                  class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeColors}`}
                >
                  {targetUser.status}
                </span>
              </dd>
            </div>
            <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt class="text-sm font-medium text-gray-900">Created</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                {new Date(targetUser.created_at).toLocaleDateString("en-GB")}
              </dd>
            </div>
            <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt class="text-sm font-medium text-gray-900">Last Login</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                {targetUser.last_login_at
                  ? new Date(targetUser.last_login_at).toLocaleString("en-GB")
                  : "—"}
              </dd>
            </div>
            <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt class="text-sm font-medium text-gray-900">Session</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                {activeSession ? (
                  <span class="inline-flex items-center gap-x-1.5 text-sm">
                    <span class="inline-block size-2 rounded-full bg-green-500" />
                    Active session
                  </span>
                ) : (
                  <span class="text-sm text-gray-500">No active session</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Course codes */}
      <div class="mt-8">
        <h2 class="text-lg font-medium text-gray-900">
          Course Codes ({courseCodes.length})
        </h2>
        <div class="mt-4 overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  Code
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Submissions
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {courseCodes.length === 0 ? (
                <tr>
                  <td
                    colspan={3}
                    class="py-4 text-center text-sm text-gray-500"
                  >
                    No course codes created.
                  </td>
                </tr>
              ) : (
                courseCodes.map((row) => (
                  <tr>
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                      <a
                        href={`/admin/course-codes/${encodeURIComponent(row.code)}`}
                        class="text-primary-600 hover:text-primary-500"
                      >
                        {row.code}
                      </a>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {row.submission_count}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(row.created_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete modal backdrop */}
      <div
        id="delete-modal-backdrop"
        class="fixed inset-0 z-40 hidden bg-gray-900/80"
      />

      {/* Delete modal */}
      <div id="delete-modal" class="fixed inset-0 z-50 hidden">
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900">Delete User</h3>
            <p class="mt-2 text-sm text-gray-500">
              This action cannot be undone. This will permanently delete the
              user account and all associated data.
            </p>
            <form
              action={`/admin/users/${targetUser.id}/delete`}
              method="post"
              class="mt-4 space-y-4"
            >
              <div>
                <label
                  for="delete-confirm-input"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type 'delete' to confirm
                </label>
                <input
                  type="text"
                  id="delete-confirm-input"
                  name="confirmation"
                  required
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                />
              </div>
              <div class="flex justify-end gap-x-3">
                <Button type="button" variant="secondary" class="modal-cancel">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  id="delete-submit"
                  disabled
                >
                  Delete
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Safe: static inline script — targetUser.id is a server-generated UUID, not user input */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function() {
  var modal = document.getElementById('delete-modal');
  var backdrop = document.getElementById('delete-modal-backdrop');
  var openBtn = document.getElementById('delete-modal-open');
  var cancelBtns = document.querySelectorAll('.modal-cancel');
  var confirmInput = document.getElementById('delete-confirm-input');
  var submitBtn = document.getElementById('delete-submit');

  function openModal() { modal.classList.remove('hidden'); backdrop.classList.remove('hidden'); confirmInput.value = ''; disableSubmit(); confirmInput.focus(); }
  function closeModal() { modal.classList.add('hidden'); backdrop.classList.add('hidden'); }
  function disableSubmit() { submitBtn.disabled = true; submitBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
  function enableSubmit() { submitBtn.disabled = false; submitBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }

  if (confirmInput) {
    confirmInput.addEventListener('input', function() {
      if (confirmInput.value.trim().toLowerCase() === 'delete') enableSubmit();
      else disableSubmit();
    });
  }
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  cancelBtns.forEach(function(btn) { btn.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });
})();

var copyBtn = document.getElementById('copy-invite-btn');
if (copyBtn) {
  copyBtn.addEventListener('click', function() {
    copyBtn.disabled = true;
    copyBtn.textContent = 'Generating...';
    fetch('/admin/api/users/${targetUser.id}/invite', { method: 'POST' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.url) {
          navigator.clipboard.writeText(data.url).then(function() {
            copyBtn.textContent = 'Copied!';
            setTimeout(function() { copyBtn.textContent = 'Copy Invite Link'; copyBtn.disabled = false; }, 2000);
          });
        }
      })
      .catch(function() {
        copyBtn.textContent = 'Error';
        setTimeout(function() { copyBtn.textContent = 'Copy Invite Link'; copyBtn.disabled = false; }, 2000);
      });
  });
}`,
        }}
      />
    </AdminLayout>
  );
}

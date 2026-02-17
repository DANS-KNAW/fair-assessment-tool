import type { Pool } from "mysql2/promise";
import { getAllCourseCodes } from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import { AdminLayout } from "../layout/AdminLayout.js";
import { Button } from "../ui/Button.js";
import { FlashMessage } from "../ui/FlashMessage.js";

interface CourseCodesPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
  flash?: string;
  flashVariant?: "success" | "error";
}

export async function CourseCodesPage({
  pool,
  user,
  currentPath,
  flash,
  flashVariant,
}: CourseCodesPageProps) {
  const courseCodes = await getAllCourseCodes(pool);

  return (
    <AdminLayout title="Course Codes" user={user} currentPath={currentPath}>
      {/* Header */}
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Course Codes
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Manage course codes and view assessment analytics
          </p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button id="create-modal-open" variant="primary">
            Create Course Code
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
                Avg FAIR Score
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
                <td colspan={4} class="py-4 text-center text-sm text-gray-500">
                  No course codes yet. Create one to get started.
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
                    {row.avg_fair_score !== null
                      ? `${Number(row.avg_fair_score).toFixed(1)}/10`
                      : "\u2014"}
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

      {/* Create modal backdrop */}
      <div
        id="create-modal-backdrop"
        class="fixed inset-0 z-40 hidden bg-gray-900/80"
      />

      {/* Create modal */}
      <div id="create-modal" class="fixed inset-0 z-50 hidden">
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900">
              Create Course Code
            </h3>
            <form
              action="/admin/course-codes"
              method="post"
              class="mt-4 space-y-4"
            >
              <div>
                <label
                  for="code"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Code
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    placeholder="e.g. FAIR-2026-01"
                    class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 sm:text-sm/6"
                  />
                  <span
                    id="code-spinner"
                    class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden"
                  >
                    <svg
                      class="size-4 animate-spin text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Checking availability"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </span>
                </div>
                <p id="code-feedback" class="mt-1 text-sm hidden" />
              </div>
              <div class="flex justify-end gap-x-3">
                <Button type="button" variant="secondary" class="modal-cancel">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  id="create-submit"
                  disabled
                >
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
          __html: `(function() {
  var modal = document.getElementById('create-modal');
  var backdrop = document.getElementById('create-modal-backdrop');
  var openBtn = document.getElementById('create-modal-open');
  var cancelBtns = document.querySelectorAll('.modal-cancel');
  var codeInput = document.getElementById('code');
  var submitBtn = document.getElementById('create-submit');
  var spinner = document.getElementById('code-spinner');
  var feedback = document.getElementById('code-feedback');
  var debounceTimer = null;

  function openModal() {
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    codeInput.value = '';
    disableSubmit();
    hideFeedback();
    codeInput.focus();
  }
  function closeModal() {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  }
  function disableSubmit() {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    submitBtn.classList.remove('cursor-pointer');
  }
  function enableSubmit() {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    submitBtn.classList.add('cursor-pointer');
  }
  function showFeedback(text, isError) {
    feedback.textContent = text;
    feedback.classList.remove('hidden', 'text-green-600', 'text-red-600');
    feedback.classList.add(isError ? 'text-red-600' : 'text-green-600');
  }
  function hideFeedback() {
    feedback.classList.add('hidden');
    feedback.textContent = '';
  }

  if (codeInput) {
    codeInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      var code = codeInput.value.trim();
      if (code === '') {
        disableSubmit();
        hideFeedback();
        spinner.classList.add('hidden');
        return;
      }
      disableSubmit();
      spinner.classList.remove('hidden');
      debounceTimer = setTimeout(function() {
        fetch('/admin/api/course-codes/check?code=' + encodeURIComponent(code))
          .then(function(r) { return r.json(); })
          .then(function(data) {
            spinner.classList.add('hidden');
            if (data.available) {
              enableSubmit();
              showFeedback('Available', false);
            } else {
              disableSubmit();
              showFeedback('Course code already exists', true);
            }
          })
          .catch(function() {
            spinner.classList.add('hidden');
            disableSubmit();
          });
      }, 300);
    });
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  cancelBtns.forEach(function(btn) {
    btn.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
})();`,
        }}
      />
    </AdminLayout>
  );
}

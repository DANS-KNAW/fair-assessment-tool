import type { Pool } from "mysql2/promise";
import { getSubmissionsPage, getTotalSubmissions } from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import { getFairLabel, getFairScore } from "../../utils/fair-score.js";
import { AdminLayout } from "../layout/AdminLayout.js";

interface SubmissionsPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
  page: number;
}

const PAGE_SIZE = 20;

export async function SubmissionsPage({
  pool,
  user,
  currentPath,
  page,
}: SubmissionsPageProps) {
  const [submissions, totalCount] = await Promise.all([
    getSubmissionsPage(pool, page, PAGE_SIZE),
    getTotalSubmissions(pool),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <AdminLayout title="Submissions" user={user} currentPath={currentPath}>
      <div class="mb-8">
        <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Submissions
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          All FAIR-Aware assessment submissions
        </p>
      </div>

      <div class="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                Course Code
              </th>
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                FAIR Score
              </th>
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {submissions.length === 0 ? (
              <tr>
                <td colspan={3} class="py-4 text-center text-sm text-gray-500">
                  No submissions yet
                </td>
              </tr>
            ) : (
              submissions.map((row) => {
                const score = getFairScore(row);
                const label = getFairLabel(score);
                return (
                  <tr>
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {row.cq1 || "—"}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {score}/10 — {label}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {row.submission_date
                        ? new Date(row.submission_date).toLocaleString("en-GB")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <nav
          class="mt-4 flex items-center justify-between"
          aria-label="Pagination"
        >
          <p class="text-sm text-gray-700">
            Showing <span class="font-medium">{start}</span> to{" "}
            <span class="font-medium">{end}</span> of{" "}
            <span class="font-medium">{totalCount}</span> submissions
          </p>
          <div class="flex gap-x-2">
            {page > 1 ? (
              <a
                href={`/admin/submissions?page=${page - 1}`}
                class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Previous
              </a>
            ) : (
              <span class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                Previous
              </span>
            )}
            {page < totalPages ? (
              <a
                href={`/admin/submissions?page=${page + 1}`}
                class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Next
              </a>
            ) : (
              <span class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </nav>
      )}
    </AdminLayout>
  );
}

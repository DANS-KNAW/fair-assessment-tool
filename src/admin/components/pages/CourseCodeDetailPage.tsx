import type { Pool } from "mysql2/promise";
import {
  getCourseCodeByCode,
  getCourseCodeQuestionBreakdown,
  getCourseCodeStats,
  getHostsByCourseCode,
  getSubmissionCountByCourseCode,
  getSubmissionsByCourseCode,
} from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import { getFairLabel, getFairScore } from "../../utils/fair-score.js";
import { AdminLayout } from "../layout/AdminLayout.js";
import { StatCard } from "../ui/StatCard.js";

interface CourseCodeDetailPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
  code: string;
  page: number;
}

const PAGE_SIZE = 20;

export async function CourseCodeDetailPage({
  pool,
  user,
  currentPath,
  code,
  page,
}: CourseCodeDetailPageProps) {
  const [courseCode, stats, breakdown, submissions, totalCount, hosts] =
    await Promise.all([
      getCourseCodeByCode(pool, code),
      getCourseCodeStats(pool, code),
      getCourseCodeQuestionBreakdown(pool, code),
      getSubmissionsByCourseCode(pool, code, page, PAGE_SIZE),
      getSubmissionCountByCourseCode(pool, code),
      getHostsByCourseCode(pool, code),
    ]);

  if (courseCode === null) {
    return (
      <AdminLayout title={code} user={user} currentPath={currentPath}>
        <div class="mb-4">
          <a
            href="/admin/course-codes"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            &larr; Back to Course Codes
          </a>
        </div>
        <p class="text-sm text-gray-500">Course code not found.</p>
      </AdminLayout>
    );
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <AdminLayout title={code} user={user} currentPath={currentPath}>
      {/* Back link */}
      <div class="mb-4">
        <a
          href="/admin/course-codes"
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          &larr; Back to Course Codes
        </a>
      </div>

      {/* Header */}
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">{courseCode.code}</h1>
          {stats.total > 0 && (
            <a
              href={`/admin/api/download/${encodeURIComponent(courseCode.code)}`}
              class="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Download CSV
            </a>
          )}
        </div>
        <div class="mt-2 flex flex-wrap gap-x-6 text-sm text-gray-500">
          <span>
            Created: {new Date(courseCode.created_at).toLocaleString("en-GB")}
          </span>
          <span>
            Created by: {courseCode.creator_name || courseCode.creator_email}
          </span>
          <span>Host(s): {hosts.length > 0 ? hosts.join(", ") : "—"}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div class="grid grid-cols-2 gap-px bg-gray-900/5 sm:grid-cols-3 lg:grid-cols-5 mb-8">
        <StatCard
          name="Total Assessments"
          value={stats.total.toLocaleString()}
        />
        <StatCard
          name="Avg FAIR Score"
          value={
            stats.avgScore !== null
              ? `${Number(stats.avgScore).toFixed(1)}/10`
              : "—"
          }
        />
        <StatCard name="Low" value={stats.low.toLocaleString()} unit="< 6" />
        <StatCard
          name="Moderate"
          value={stats.moderate.toLocaleString()}
          unit="6–7"
        />
        <StatCard name="High" value={stats.high.toLocaleString()} unit="8+" />
      </div>

      {/* Per-question breakdown */}
      <div class="mt-8">
        <h2 class="text-lg font-medium text-gray-900">Question Breakdown</h2>
        <div class="mt-4 overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  Question
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Yes
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Avg Likelihood (Yes)
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  No
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Avg Likelihood (No)
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {breakdown.map((question) => (
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {question.label}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {question.yes}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {question.yesAvgLikelihood !== null
                      ? `${question.yesAvgLikelihood.toFixed(1)}/5`
                      : "—"}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {question.no}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {question.noAvgLikelihood !== null
                      ? `${question.noAvgLikelihood.toFixed(1)}/5`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Assessments */}
      <div class="mt-8">
        <h2 class="text-lg font-medium text-gray-900">
          Individual Assessments
        </h2>
        <div class="mt-4 overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
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
                  <td
                    colspan={2}
                    class="py-4 text-center text-sm text-gray-500"
                  >
                    No assessments submitted yet
                  </td>
                </tr>
              ) : (
                submissions.map((row) => {
                  const score = getFairScore(row);
                  const label = getFairLabel(score);
                  return (
                    <tr class="hover:bg-gray-50">
                      <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                        <a
                          href={`/admin/assessments/${row.id}?from=/admin/course-codes/${encodeURIComponent(code)}`}
                          class="text-primary-600 hover:text-primary-500"
                        >
                          {score}/10 — {label}
                        </a>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {row.submission_date
                          ? new Date(row.submission_date).toLocaleString(
                              "en-GB",
                            )
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
            <span class="font-medium">{totalCount}</span> assessments
          </p>
          <div class="flex gap-x-2">
            {page > 1 ? (
              <a
                href={`/admin/course-codes/${encodeURIComponent(code)}?page=${page - 1}`}
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
                href={`/admin/course-codes/${encodeURIComponent(code)}?page=${page + 1}`}
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

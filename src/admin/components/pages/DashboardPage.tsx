import type { Pool } from "mysql2/promise";
import {
  getMonthlySubmissions,
  getRecentSubmissions,
  getTotalSubmissions,
  getUniqueCourseCodeCount,
  getUniqueDomainCount,
} from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import { AdminLayout } from "../layout/AdminLayout.js";
import { StatCard } from "../ui/StatCard.js";

interface DashboardPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
}

export async function DashboardPage({
  pool,
  user,
  currentPath,
}: DashboardPageProps) {
  const [
    totalSubmissions,
    monthlySubmissions,
    uniqueCodes,
    uniqueDomains,
    recentSubmissions,
  ] = await Promise.all([
    getTotalSubmissions(pool),
    getMonthlySubmissions(pool),
    getUniqueCourseCodeCount(pool),
    getUniqueDomainCount(pool),
    getRecentSubmissions(pool, 10),
  ]);

  return (
    <AdminLayout title="Dashboard" user={user} currentPath={currentPath}>
      <div class="mb-8">
        <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          Overview of FAIR-Aware assessment submissions
        </p>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          name="Total Submissions"
          value={totalSubmissions.toLocaleString()}
        />
        <StatCard
          name="This Month"
          value={monthlySubmissions.toLocaleString()}
        />
        <StatCard name="Course Codes" value={uniqueCodes.toLocaleString()} />
        <StatCard
          name="Research Domains"
          value={uniqueDomains.toLocaleString()}
        />
      </div>

      {/* Recent submissions */}
      <div class="mt-8">
        <h2 class="text-lg font-medium leading-6 text-gray-900">
          Recent Submissions
        </h2>
        <div class="mt-4 overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
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
                  Domain
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
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td
                    colspan={3}
                    class="py-4 text-center text-sm text-gray-500"
                  >
                    No submissions yet
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((row) => (
                  <tr>
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {row.cq1 || "—"}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {row.yq1 || "—"}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {row.submission_date
                        ? new Date(row.submission_date).toLocaleDateString(
                            "en-GB",
                          )
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

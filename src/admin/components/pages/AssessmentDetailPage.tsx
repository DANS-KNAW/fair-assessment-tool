import type { Child } from "hono/jsx";
import type { Pool } from "mysql2/promise";
import type { AssessmentDetailRow } from "../../db/queries.js";
import { getSubmissionById } from "../../db/queries.js";
import type { AdminUser } from "../../types.js";
import {
  FAIR_QUESTIONS,
  getFairLabel,
  getFairScore,
  INTENTION_LABELS,
} from "../../utils/fair-score.js";
import { AdminLayout } from "../layout/AdminLayout.js";
import { StatCard } from "../ui/StatCard.js";

interface AssessmentDetailPageProps {
  pool: Pool;
  user: AdminUser;
  currentPath: string;
  id: number;
  referer: string | null;
}

export async function AssessmentDetailPage({
  pool,
  user,
  currentPath,
  id,
  referer,
}: AssessmentDetailPageProps) {
  const submission = await getSubmissionById(pool, id);

  if (!submission) {
    return (
      <AdminLayout
        title="Assessment Not Found"
        user={user}
        currentPath={currentPath}
      >
        <div class="mb-4">
          <a
            href="/admin"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            &larr; Back to Dashboard
          </a>
        </div>
        <p class="text-sm text-gray-500">Assessment not found.</p>
      </AdminLayout>
    );
  }

  const score = getFairScore(submission);
  const label = getFairLabel(score);

  const backHref = referer ?? "/admin";
  const backLabel = referer?.includes("/course-codes/")
    ? "Back to Course Code"
    : "Back to Dashboard";

  return (
    <AdminLayout
      title={`Assessment #${id}`}
      user={user}
      currentPath={currentPath}
    >
      {/* Back link */}
      <div class="mb-4">
        <a
          href={backHref}
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          &larr; {backLabel}
        </a>
      </div>

      {/* Header */}
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Assessment #{id}</h1>
        <div class="mt-2 flex flex-wrap gap-x-6 text-sm text-gray-500">
          <span>
            Date:{" "}
            {submission.submission_date
              ? new Date(submission.submission_date).toLocaleString("en-GB")
              : "—"}
          </span>
          <span>Course: {submission.cq1 || "—"}</span>
          <span>Host: {submission.host || "—"}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div class="grid grid-cols-2 gap-px bg-gray-900/5 sm:grid-cols-3 mb-8">
        <StatCard name="FAIR Score" value={`${score}/10`} />
        <StatCard name="Level" value={label} />
        <StatCard
          name="Avg Intention"
          value={getAvgIntention(submission)}
          unit="/5"
        />
      </div>

      {/* Demographics */}
      <Section title="Demographics">
        <DefinitionList
          items={[
            { label: "Research Domain", value: submission.yq1 },
            { label: "Role(s)", value: submission.yq2 },
            { label: "Organization Type(s)", value: submission.yq3 },
          ]}
        />
      </Section>

      {/* FAIR Answers */}
      <Section title="FAIR Answers">
        <div class="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
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
                  Answer
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Intention
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {FAIR_QUESTIONS.map((q) => {
                const answer = submission[q.key as keyof AssessmentDetailRow] as
                  | string
                  | null;
                const intentionValue = submission[
                  `${q.key}i` as keyof AssessmentDetailRow
                ] as string | null;
                const intentionLabel = intentionValue
                  ? (INTENTION_LABELS[intentionValue] ?? intentionValue)
                  : null;
                return (
                  <tr>
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {q.label}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <AnswerBadge answer={answer} />
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {intentionLabel
                        ? `${intentionValue}/5 — ${intentionLabel}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Feedback">
        <DefinitionList
          items={[
            { label: "Topics not understandable", value: submission.qq1 },
            { label: "Missing metrics/topics", value: submission.qq2 },
            { label: "General feedback", value: submission.qq3 },
            { label: "Awareness raised", value: submission.qq4 },
          ]}
        />
      </Section>
    </AdminLayout>
  );
}

// ── Local helpers ──

function AnswerBadge({ answer }: { answer: string | null }) {
  if (!answer) return <span class="text-gray-400">{"—"}</span>;
  const isYes = answer.toLowerCase() === "yes";
  const colors = isYes
    ? "bg-green-50 text-green-700 ring-green-600/20"
    : "bg-red-50 text-red-700 ring-red-600/20";
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors}`}
    >
      {answer}
    </span>
  );
}

function Section({ title, children }: { title: string; children: Child }) {
  return (
    <div class="mt-8">
      <h2 class="text-lg font-medium text-gray-900">{title}</h2>
      <div class="mt-4">{children}</div>
    </div>
  );
}

function DefinitionList({
  items,
}: {
  items: Array<{ label: string; value: string | null }>;
}) {
  return (
    <dl class="divide-y divide-gray-100">
      {items.map((item) => (
        <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-sm font-medium text-gray-900">{item.label}</dt>
          <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
            {item.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function getAvgIntention(submission: Record<string, unknown>): string {
  const values = FAIR_QUESTIONS.map((q) => `${q.key}i`)
    .map((k) => Number(submission[k]))
    .filter((v) => !Number.isNaN(v) && v > 0);
  if (values.length === 0) return "—";
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

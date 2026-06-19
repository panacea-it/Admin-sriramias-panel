import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PaginatedFigmaTable from "../figma/PaginatedFigmaTable";
import StatCard from "../dashboard/StatCard";
import { Target, TrendingDown, Trophy, Zap } from "lucide-react";
import { cn } from "../../utils/cn";

const HEAT_COLORS = ["#fee2e2", "#fef3c7", "#d1fae5", "#6ee7b7", "#059669"];

function heatColor(value) {
  if (value >= 80) return HEAT_COLORS[4];
  if (value >= 70) return HEAT_COLORS[3];
  if (value >= 60) return HEAT_COLORS[2];
  if (value >= 50) return HEAT_COLORS[1];
  return HEAT_COLORS[0];
}

const EMPTY_ANALYTICS = {
  summary: { avgAttemptRate: 0, topScorerAvg: 0, accuracyIndex: 0 },
  subjectWisePerformance: [],
  accuracyHeatmap: [],
  topScorers: [],
  weakAreas: [],
}

export default function TestManagementAnalyticsSection({ analyticsData = EMPTY_ANALYTICS }) {
  const data = analyticsData ?? EMPTY_ANALYTICS
  const { subjectWisePerformance, accuracyHeatmap, topScorers, weakAreas } = data

  // 1. Process Heatmap data for the table
  const heatmap = useMemo(() => {
    if (!accuracyHeatmap || accuracyHeatmap.length === 0)
      return { subjects: [], difficulties: [], values: [] };
    const subjects = accuracyHeatmap.map((item) => item.subject);
    const difficulties = ["easy", "medium", "hard"];
    const values = accuracyHeatmap.map((item) => [
      item.easy,
      item.medium,
      item.hard,
    ]);
    return { subjects, difficulties, values };
  }, [accuracyHeatmap]);

  // 2. Map Top Scorers to table columns
  const scorerColumns = [
    { key: "rank", label: "Rank" },
    { key: "studentName", label: "Student" },
    { key: "rollNumber", label: "Roll" },
    { key: "score", label: "Score" },
    { key: "subject", label: "Subject" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-[#1a3a5c]">Analytics</h2>

      {/* Stats Cards wired to the summary data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Attempt Rate"
          value={`${data.summary?.avgAttemptRate || 0}%`}
          color="#55ace7"
          icon={Zap}
        />
        <StatCard
          title="Top Scorer Avg"
          value={data.summary?.topScorerAvg || 0}
          color="#10b981"
          icon={Trophy}
        />
        <StatCard
          title="Weak Topics"
          value={weakAreas?.length || 0}
          color="#ef4444"
          icon={TrendingDown}
        />
        <StatCard
          title="Accuracy Index"
          value={`${data.summary?.accuracyIndex || 0}%`}
          color="#8b5cf6"
          icon={Target}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subject-wise Performance Chart */}
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">
            Subject-wise Performance
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjectWisePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="avgPercentage"
                fill="#55ace7"
                name="Avg %"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="attempts"
                fill="#1a3a5c"
                name="Attempts"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </article>

        {/* Accuracy Heatmap */}
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">
            Accuracy Heatmap
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-center text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-slate-600" />
                  {heatmap.difficulties.map((d) => (
                    <th
                      key={d}
                      className="p-2 font-semibold text-slate-600 uppercase"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.subjects.map((sub, ri) => (
                  <tr key={sub}>
                    <td className="p-2 text-left font-medium text-[#333]">
                      {sub}
                    </td>
                    {heatmap.values[ri].map((val, ci) => (
                      <td key={ci} className="p-1">
                        <span
                          className="inline-flex min-w-[48px] justify-center rounded-md px-2 py-2 font-semibold text-[#1a3a5c]"
                          style={{ backgroundColor: heatColor(val) }}
                        >
                          {val}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Scorers Table */}
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Top Scorers</h3>
          <PaginatedFigmaTable
            columns={scorerColumns}
            data={topScorers}
            itemLabel="students"
            initialPageSize={5}
          />
        </article>

        {/* Weak Areas List */}
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Weak Areas</h3>
          <ul className="space-y-2">
            {weakAreas.length > 0 ? (
              weakAreas.map((w, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#333]">{w.topic}</p>
                    <p className="text-xs text-slate-500">{w.subject}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {w.accuracy}%
                  </span>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-400 p-4">
                No weak areas identified.
              </p>
            )}
          </ul>
        </article>
      </div>
    </div>
  );
}

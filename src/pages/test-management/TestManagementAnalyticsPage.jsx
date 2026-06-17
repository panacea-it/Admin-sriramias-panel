import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PaginatedFigmaTable from "../../components/figma/PaginatedFigmaTable";
import StatCard from "../../components/dashboard/StatCard";
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

export default function TestManagementAnalyticsSection({ analyticsData }) {
  const {
    summary,
    subjectWisePerformance,
    accuracyHeatmap,
    topScorers,
    weakAreas,
  } = analyticsData;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-[#1a3a5c]">Analytics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Attempt Rate"
          value={`${summary?.avgAttemptRate || 0}%`}
          color="#55ace7"
          icon={Zap}
        />
        <StatCard
          title="Top Scorer Avg"
          value={summary?.topScorerAvg || 0}
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
          value={`${summary?.accuracyIndex || 0}%`}
          color="#8b5cf6"
          icon={Target}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
        {/* ... Heatmap rendering ... */}
      </div>
    </div>
  );
}

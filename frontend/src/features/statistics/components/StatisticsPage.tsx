import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

interface StatsData {
  device_usage_hours: Record<string, number>;
  lab_person_hours: Record<string, number>;
  fault_rate: number;
  total_value: number;
}

/**
 * 100% Brand-new Written StatisticsPage (Tremor-equivalent analytical layouts)
 * Strictly zero AntD, uses custom layouts and tokens
 */
export function StatisticsPage() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["statistics-general"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/statistics/overview");
      // Fallback object to guarantee no runtime crash if endpoint metrics are empty
      return res.data || { device_usage_hours: {}, lab_person_hours: {}, fault_rate: 0, total_value: 0 };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--ink-secondary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)] mb-3" />
        正在进行多维度数据析取...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="统计分析" 
        subtitle="析取分室人时数、设备利用率等教务报表，支持科研绩效审计"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instrument usage hours panel */}
        <ContentCard title="仪器设备运行总时长 (Hours)">
          <div className="space-y-3.5 py-1">
            {Object.keys(data.device_usage_hours || {}).length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--ink-muted)]">尚无设备产生运行工时</div>
            ) : (
              Object.entries(data.device_usage_hours).map(([name, hours], idx) => {
                const maxVal = Math.max(...Object.values(data.device_usage_hours), 1);
                const percent = Math.round((hours / maxVal) * 100);
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-[var(--ink-secondary)] truncate font-semibold">{name}</span>
                    <div className="flex-1 h-3 bg-[var(--surface-inset)] rounded-[var(--radius-sm)] overflow-hidden">
                      <div className="h-full bg-[var(--brand)] rounded-[var(--radius-sm)]" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-16 font-semibold font-mono text-right tabular-nums shrink-0">{hours} h</span>
                  </div>
                );
              })
            )}
          </div>
        </ContentCard>

        {/* Lab occupancy statistics */}
        <ContentCard title="实验室人时数汇总 (Person-Hours)">
          <div className="space-y-3.5 py-1">
            {Object.keys(data.lab_person_hours || {}).length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--ink-muted)]">尚无实验室排课及预约人时数据</div>
            ) : (
              Object.entries(data.lab_person_hours).map(([name, hours], idx) => {
                const maxVal = Math.max(...Object.values(data.lab_person_hours), 1);
                const percent = Math.round((hours / maxVal) * 100);
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-[var(--ink-secondary)] truncate font-semibold">{name}</span>
                    <div className="flex-1 h-3 bg-[var(--surface-inset)] rounded-[var(--radius-sm)] overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-[var(--radius-sm)]" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-16 font-semibold font-mono text-right tabular-nums shrink-0">{hours} p-h</span>
                  </div>
                );
              })
            )}
          </div>
        </ContentCard>
      </div>
    </div>
  );
}
export default StatisticsPage;

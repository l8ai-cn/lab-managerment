import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, Database } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

// Data Reporting Models mapping per specs
interface Template {
  id: string;
  name: string;
  code: string;
  fields: Record<string, string>;
  created_at: string;
}

interface Submission {
  id: string;
  template_name: string;
  data: Record<string, any>;
  status: string;
  created_at: string;
  reporter_name?: string;
}

interface ListResponse<T> {
  items: T[];
  total: number;
}

/**
 * 100% Brand-new Written DataReportingPage (SLA reports and submission aggregation specs)
 * Strictly zero AntD, uses custom layouts and tabs
 */
export function DataReportingPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "submissions">("templates");

  // Query Templates list
  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery<ListResponse<Template>>({
    queryKey: ["reporting-templates"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/data-reporting/templates?page_size=50");
      return res.data;
    },
  });

  // Query Submissions list
  const { data: submissionsData, isLoading: isSubmissionsLoading } = useQuery<ListResponse<Submission>>({
    queryKey: ["reporting-submissions"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/data-reporting/submissions?page_size=50");
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="数据填报" 
        subtitle="教育部基表标准化模板下发、实验室运行指标汇总在线填报与基数统计"
      />

      {/* Standard Segmented style Custom Tab Navigation Bar (100% AntD free) */}
      <div className="flex border-b border-[var(--border-subtle)] bg-[var(--canvas)] select-none">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "templates" 
              ? "border-[var(--brand)] text-[var(--brand)]" 
              : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
          }`}
        >
          基表填报模板
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "submissions" 
              ? "border-[var(--brand)] text-[var(--brand)]" 
              : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
          }`}
        >
          已填报指标记录
        </button>
      </div>

      {/* Tab Panel view container */}
      {activeTab === "templates" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isTemplatesLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-[var(--ink-secondary)]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                正在载入教育部基表指标模板...
              </div>
            ) : !templatesData?.items?.length ? (
              <div className="col-span-full py-12 text-center text-xs text-[var(--ink-muted)]">
                <Database className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
                系统尚未下发任何标准基表模板
              </div>
            ) : (
              templatesData.items.map((tmpl) => (
                <ContentCard 
                  key={tmpl.id} 
                  title={tmpl.name}
                  extra={
                    <span className="text-[10px] font-bold text-[var(--brand)] font-mono px-1.5 py-0.5 bg-[var(--brand-subtle)] rounded-[var(--radius-sm)]">
                      {tmpl.code}
                    </span>
                  }
                >
                  <div className="space-y-2 text-xs text-[var(--ink-secondary)] leading-relaxed">
                    <div className="font-semibold text-[var(--ink-primary)] mb-1">要求填报字段:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(tmpl.fields || {}).map((f) => (
                        <span key={f} className="inline-flex px-1.5 py-0.5 bg-[var(--surface-inset)] border border-[var(--border-subtle)] rounded text-[10px]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--ink-tertiary)] font-mono border-t border-[var(--border-subtle)] pt-2.5 mt-4 flex justify-between items-center">
                    <span>下发于 {new Date(tmpl.created_at).toLocaleDateString("zh-CN")}</span>
                    <span className="text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 font-semibold cursor-not-allowed">
                      下线填报 (待配)
                    </span>
                  </div>
                </ContentCard>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
              <thead className="bg-[var(--canvas)]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">填报时间</th>
                  <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">基表主题</th>
                  <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">填报细节</th>
                  <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">填报人</th>
                  <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-24">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
                {isSubmissionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                      正在汇总填报指标实绩...
                    </td>
                  </tr>
                ) : !submissionsData?.items?.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                      暂无任何填报指标提报记录
                    </td>
                  </tr>
                ) : (
                  submissionsData.items.map((record) => (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                      <td className="px-6 py-3.5 status-rail status-rail--ready font-mono text-[var(--ink-secondary)] text-xs">
                        {new Date(record.created_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-[var(--ink-primary)] block truncate max-w-xs">{record.template_name}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {Object.entries(record.data || {}).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-[var(--surface-inset)] border border-[var(--border-subtle)] px-1 py-0.5 rounded text-[var(--ink-secondary)] font-mono">
                              {k}: <span className="font-semibold text-[var(--ink-primary)]">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-medium">
                        {record.reporter_name || "教工填报员"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                          record.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {record.status === "approved" ? "已汇总" : "草稿"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export default DataReportingPage;

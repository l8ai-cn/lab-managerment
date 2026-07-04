import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Monitor } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

interface ClassBoard {
  id: string;
  name: string;
  code: string;
  lab_name: string;
  current_course: string | null;
  current_teacher: string | null;
  status: string;
}

interface ListResponse {
  items: ClassBoard[];
}

/**
 * 100% Brand-new Written ClassBoardPage (electronic classroom signs display)
 * Strictly zero AntD, uses custom layouts and tokens
 */
export function ClassBoardPage() {
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["class-boards"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/access-control/class-boards");
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="电子班牌" 
        subtitle="管理分室门外壁挂电子班牌展示、排课课程看板态势"
      />

      {/* Main Grid displaying electronic classroom signs (Zero AntD Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--ink-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
            正在载入电子班牌通信树...
          </div>
        ) : !data?.items?.length ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--ink-muted)]">
            <Monitor className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
            系统内尚无注册连接的电子班牌硬件
          </div>
        ) : (
          data.items.map((board) => (
            <ContentCard 
              key={board.id} 
              title={board.name}
              extra={
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)] ${
                  board.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"
                }`}>
                  {board.status === "active" ? "在线" : "离线"}
                </span>
              }
            >
              <div className="space-y-3.5 text-xs text-[var(--ink-secondary)] leading-relaxed">
                <div>
                  <span className="text-[var(--ink-tertiary)] block">关联物理分室:</span>
                  <span className="font-semibold text-[var(--ink-primary)] block mt-0.5">{board.lab_name}</span>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-3.5">
                  <span className="text-[var(--ink-tertiary)] block">当前进行中课程 / 会议:</span>
                  <span className="font-semibold text-[var(--ink-primary)] block mt-0.5">
                    {board.current_course || "当前无课 (空闲)"}
                  </span>
                  {board.current_teacher && (
                    <span className="text-[10px] text-[var(--ink-tertiary)] block mt-0.5">主讲教师: {board.current_teacher}</span>
                  )}
                </div>
              </div>
            </ContentCard>
          ))
        )}
      </div>
    </div>
  );
}
export default ClassBoardPage;

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Search, Loader2, Building } from "lucide-react";

interface Lab {
  id: string;
  name: string;
  code: string;
  lab_type: string;
  open_status: string;
  capacity: number;
}

interface ListResponse {
  items: Lab[];
}

export function MobileLabList() {
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["mobile-labs", keyword],
    queryFn: async () => {
      const endpoint = keyword 
        ? `/api/v1/labs?page_size=100&keyword=${encodeURIComponent(keyword)}`
        : `/api/v1/labs?page_size=100`;
      const res = await axios.get(endpoint);
      return res.data;
    },
  });

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-[var(--ink-primary)]">实验室列表</h2>
        <p className="text-[10px] text-[var(--ink-tertiary)]">查看全校所有开放中的物理实验室环境</p>
      </div>

      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="搜索分室..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="block w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
        />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--brand)]" />
        </div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 text-xs text-[var(--ink-muted)]">
          暂无匹配的分室实验室资源
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.items.map((lab) => (
            <div 
              key={lab.id} 
              className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3.5 shadow-[var(--shadow-sm)] flex items-start gap-3.5"
            >
              <div className="p-2 bg-blue-50 text-[var(--brand)] rounded-[var(--radius-sm)] shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink-primary)] truncate">{lab.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)] ${
                    lab.open_status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"
                  }`}>
                    {lab.open_status === "open" ? "开放" : "维护"}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--ink-secondary)] font-mono mt-1.5">
                  编号: {lab.code} · 容量: {lab.capacity} 人
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

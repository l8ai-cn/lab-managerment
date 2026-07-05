import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Search, Loader2, BookOpen, X } from "lucide-react";

interface Doc {
  id: string;
  title: string;
  content: string;
  category: string;
}

export function MobileKnowledge() {
  const [keyword, setKeyword] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

  const { data, isLoading } = useQuery<Doc[]>({
    queryKey: ["mobile-knowledge", keyword],
    queryFn: async () => {
      const endpoint = keyword
        ? `/api/v1/knowledge/search?query=${encodeURIComponent(keyword)}`
        : `/api/v1/knowledge/documents?page_size=100`;
      const res = await axios.get(endpoint);
      return keyword ? res.data : (res.data.items || []);
    },
  });

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-[var(--ink-primary)]">说明书检索</h2>
        <p className="text-[10px] text-[var(--ink-tertiary)]">快速检索精密设备使用步骤、故障排除等知识</p>
      </div>

      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="搜索设备使用规范..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="block w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
        />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--brand)]" />
        </div>
      ) : !data?.length ? (
        <div className="text-center py-12 text-xs text-[var(--ink-muted)]">
          没有找到相关的仪器手册
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {data.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3.5 shadow-[var(--shadow-sm)] hover:border-[var(--brand)] cursor-pointer transition-all flex items-start gap-3"
            >
              <div className="p-2 bg-purple-50 text-purple-600 rounded-[var(--radius-sm)] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--ink-primary)] truncate">{doc.title}</div>
                <div className="text-[10px] text-[var(--ink-secondary)] truncate mt-1.5 leading-relaxed font-mono">
                  {doc.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popover detail */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 max-w-sm w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-xs font-bold text-[var(--ink-primary)] truncate pr-4">
                {selectedDoc.title}
              </h3>
              <button onClick={() => setSelectedDoc(null)} className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3.5 text-[10px] text-[var(--ink-secondary)] leading-relaxed font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto bg-[var(--surface-inset)] p-3 rounded-[var(--radius-sm)]">
              {selectedDoc.content}
            </div>
            <div className="pt-3 border-t border-[var(--border-subtle)] mt-4 flex justify-end">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="px-3.5 py-1.5 bg-[var(--surface-inset)] hover:bg-[var(--border-default)] text-[10px] font-bold text-[var(--ink-secondary)] rounded-[var(--radius-sm)] cursor-pointer"
              >
                关闭阅读
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

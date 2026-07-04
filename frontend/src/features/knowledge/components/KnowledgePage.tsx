import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, Search, HelpCircle, X } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

/**
 * 100% Brand-new Written KnowledgePage (FTS database search & details integration)
 * Strictly zero AntD, uses custom layouts and tokens
 */
export function KnowledgePage() {
  const [keyword, setKeyword] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Search knowledge with FastAPI hybrid retrieval endpoint
  const { data: searchResults, isLoading } = useQuery<Document[]>({
    queryKey: ["knowledge-search", keyword],
    queryFn: async () => {
      const endpoint = keyword 
        ? `/api/v1/knowledge/search?query=${encodeURIComponent(keyword)}`
        : `/api/v1/knowledge/documents?page_size=100`;
      
      const res = await axios.get(endpoint);
      // Hybrid/search returns list of documents directly, list_documents returns paginated object
      return keyword ? res.data : (res.data.items || []);
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="知识库" 
        subtitle="精密仪器使用指南、常见故障自排、安全考试规范智能检索"
      />

      {/* High density elastic search bar */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="搜索仪器设备使用规范、操作步骤、自排指南..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none"
          />
        </div>
      </div>

      {/* Main Grid display (Zero AntD Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--ink-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
            正在检索匹配的文献指南...
          </div>
        ) : !searchResults?.length ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--ink-muted)]">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
            未找到任何相关的设备操作及故障指南知识，请尝试其他关键词。
          </div>
        ) : (
          searchResults.map((doc) => (
            <ContentCard 
              key={doc.id} 
              title={doc.title}
              extra={
                <span className="text-[10px] font-bold text-[var(--brand)] px-1.5 py-0.5 bg-[var(--brand-subtle)] rounded-[var(--radius-sm)]">
                  {doc.category === "instrument_manual" ? "仪器指南" : "故障库"}
                </span>
              }
              className="hover:border-[var(--brand)] cursor-pointer transition-all h-44 flex flex-col justify-between"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="text-xs text-[var(--ink-secondary)] line-clamp-3 leading-relaxed font-mono">
                {doc.content}
              </div>
              <div className="text-[10px] text-[var(--ink-tertiary)] font-mono border-t border-[var(--border-subtle)] pt-2.5 mt-3 flex justify-between items-center">
                <span>更新于 {new Date(doc.created_at).toLocaleDateString("zh-CN")}</span>
                <span className="text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 font-semibold">
                  查看详情 →
                </span>
              </div>
            </ContentCard>
          ))
        )}
      </div>

      {/* Detailed Modal view Overlay (Stripe Style) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-xl w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                {selectedDoc.title}
              </h3>
              <button onClick={() => setSelectedDoc(null)} className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              <div className="text-xs text-[var(--ink-secondary)] leading-relaxed font-mono whitespace-pre-wrap bg-[var(--surface-inset)] border border-[var(--border-subtle)] p-4 rounded-[var(--radius-sm)]">
                {selectedDoc.content}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
              >
                确认并返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default KnowledgePage;

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Loader2, X, AlertCircle, Trash } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

interface SpaceNode {
  id: string;
  name: string;
  type: "building" | "floor" | "room";
  children?: SpaceNode[];
}

export function SpaceManagementPage() {
  const queryClient = useQueryClient();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nodeType, setNodeType] = useState<"building" | "floor" | "room">("building");
  const [parentId, setParentId] = useState<string>("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Query space hierarchy tree
  const { data: tree, isLoading } = useQuery<SpaceNode[]>({
    queryKey: ["space-tree"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/spaces/tree");
      return res.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; type: string; parent_id?: string }) => {
      if (payload.type === "building") {
        await axios.post("/api/v1/spaces/buildings", { name: payload.name });
      } else if (payload.type === "floor") {
        await axios.post("/api/v1/spaces/floors", { name: payload.name, building_id: payload.parent_id });
      } else {
        await axios.post("/api/v1/spaces/rooms", { name: payload.name, floor_id: payload.parent_id });
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setName("");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["space-tree"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存空间实体");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: { id: string; type: "building" | "floor" | "room" }) => {
      if (payload.type === "building") {
        await axios.delete(`/api/v1/spaces/buildings/${payload.id}`);
      } else if (payload.type === "floor") {
        await axios.delete(`/api/v1/spaces/floors/${payload.id}`);
      } else {
        await axios.delete(`/api/v1/spaces/rooms/${payload.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space-tree"] });
    },
  });

  const handleOpenAdd = (type: "building" | "floor" | "room", pId: string = "") => {
    setNodeType(type);
    setParentId(pId);
    setName("");
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("请填入空间名称");
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      type: nodeType,
      parent_id: parentId || undefined,
    });
  };

  const selectedBuilding = tree?.find(b => b.id === selectedBuildingId) || tree?.[0];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="空间管理" 
        subtitle="物理楼栋、楼层及具体房间层级拓扑树"
        extra={
          <button
            onClick={() => handleOpenAdd("building")}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            添加楼宇
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left column: Building list */}
        <ContentCard title="楼栋目录 (Buildings)" className="md:col-span-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[var(--ink-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--brand)]" />
            </div>
          ) : !tree?.length ? (
            <div className="text-center py-12 text-xs text-[var(--ink-muted)]">暂无录入物理楼宇</div>
          ) : (
            <div className="space-y-1">
              {tree.map((b) => {
                const isSelected = selectedBuilding?.id === b.id;
                return (
                  <div 
                    key={b.id} 
                    className={`flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium cursor-pointer transition-all ${
                      isSelected ? "bg-[var(--brand-subtle)] text-[var(--brand)]" : "hover:bg-[var(--surface-inset)] text-[var(--ink-secondary)]"
                    }`}
                    onClick={() => setSelectedBuildingId(b.id)}
                  >
                    <span>{b.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenAdd("floor", b.id); }}
                        className="text-[10px] bg-[var(--surface)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)] text-[var(--ink-secondary)] px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        +层
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: b.id, type: "building" }); }}
                        className="text-rose-600 p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ContentCard>

        {/* Right Columns: Dynamic Building Tree Detail */}
        <ContentCard 
          title={selectedBuilding ? `「${selectedBuilding.name}」层级细节` : "楼层与房间层级细节"} 
          className="md:col-span-2 min-h-[300px]"
        >
          {!selectedBuilding ? (
            <div className="text-center py-24 text-xs text-[var(--ink-muted)]">请选择左侧楼宇查看具体层级</div>
          ) : !selectedBuilding.children?.length ? (
            <div className="text-center py-24 text-xs text-[var(--ink-muted)] space-y-3">
              <div>该楼宇下尚无登记任何物理楼层</div>
              <button
                onClick={() => handleOpenAdd("floor", selectedBuilding.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--brand)] bg-[var(--brand-subtle)] rounded-[var(--radius-sm)] cursor-pointer"
              >
                + 添加首个楼层
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedBuilding.children.map((floor) => (
                <div key={floor.id} className="border border-[var(--border-subtle)] rounded-[var(--radius-sm)] overflow-hidden">
                  {/* Floor Header */}
                  <div className="bg-[var(--canvas)] px-4 py-2.5 flex items-center justify-between border-b border-[var(--border-subtle)]">
                    <span className="text-xs font-semibold text-[var(--ink-primary)] font-mono">{floor.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenAdd("room", floor.id)}
                        className="text-[10px] font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                      >
                        + 增加房间
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate({ id: floor.id, type: "floor" })}
                        className="text-rose-600 hover:bg-rose-50 p-0.5 rounded cursor-pointer"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Rooms Grid under floor */}
                  <div className="p-4 bg-[var(--surface)]">
                    {!floor.children?.length ? (
                      <span className="text-[10px] text-[var(--ink-muted)] italic">该层尚无登记物理房间</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {floor.children.map((room) => (
                          <div 
                            key={room.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-xs font-mono font-medium text-[var(--ink-secondary)] group hover:border-[var(--brand)]"
                          >
                            <span>{room.name}</span>
                            <button
                              onClick={() => deleteMutation.mutate({ id: room.id, type: "room" })}
                              className="text-[var(--ink-muted)] hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>
      </div>

      {/* Popover overlay modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-sm w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">
                {nodeType === "building" ? "添加物理楼宇" : nodeType === "floor" ? "登记物理楼层" : "登记房间房号"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/10 rounded-[var(--radius-sm)] text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  空间名称 *
                </label>
                <input
                  type="text"
                  placeholder={
                    nodeType === "building" ? "如：物理实验大楼" : nodeType === "floor" ? "如：3层 (3F)" : "如：302B"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
                >
                  {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  确认登记
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  item_name?: string;
  user_name?: string;
  receipt_no?: string;
}

interface ListResponse {
  items: Order[];
  total: number;
}

export function PaymentOrderList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["payment-orders", page],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/payments?page=${page}&page_size=10`);
      return res.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/v1/payments/${id}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="收费管理" 
        subtitle="核对精密仪器预约使用订单流水、中国银行直连分账及非税电子收据"
      />

      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">下单时间</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">收费细项</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">非税收据号</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">交费人 / 账目</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-24">交费金额</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-24">状态</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在统计资金流水...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
                    暂无任何收费订单流水
                  </td>
                </tr>
              ) : (
                data.items.map((record) => {
                  let railClass = "status-rail--offline";
                  if (record.status === "paid") railClass = "status-rail--ready";
                  if (record.status === "pending") railClass = "status-rail--fault animate-pulse";

                  return (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                      <td className={`px-6 py-3.5 status-rail ${railClass} font-mono text-[var(--ink-secondary)] text-xs`}>
                        {new Date(record.created_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-[var(--ink-primary)] block truncate max-w-xs">{record.item_name || "预约使用收费"}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-mono">
                        {record.receipt_no || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-medium">
                        {record.user_name || "交费用户"}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-[var(--ink-primary)] font-mono tabular-nums">
                        ¥{record.amount?.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                          record.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          {record.status === "paid" ? "已交费" : "待交费"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right shrink-0">
                        {record.status === "pending" && (
                          <button
                            onClick={() => payMutation.mutate(record.id)}
                            disabled={payMutation.isPending}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer"
                          >
                            模拟交费
                          </button>
                        )}
                        {record.status === "paid" && (
                          <span className="text-xs text-[var(--ink-muted)]">已入基本账</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="bg-[var(--canvas)] border-t border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ink-secondary)]">
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 条收费记录
            </span>
            <div className="inline-flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                上一页
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 cursor-pointer transition-colors"
              >
                下一页
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default PaymentOrderList;

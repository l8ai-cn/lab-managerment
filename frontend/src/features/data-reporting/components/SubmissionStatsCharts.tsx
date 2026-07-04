import { useQuery } from "@tanstack/react-query";
import { Col, Progress, Row, Statistic } from "antd";
import { ContentCard } from "@/shared/components/ContentCard";
import { dataReportingApi } from "../api/dataReportingApi";

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审核",
};

export function SubmissionStatsCharts() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["submission-stats"],
    queryFn: dataReportingApi.submissionStats,
  });

  if (isLoading || !stats) {
    return null;
  }

  const statusTotal = Object.values(stats.by_status).reduce((s, c) => s + c, 0) || 1;
  const periodEntries = Object.entries(stats.by_period).sort(([a], [b]) => a.localeCompare(b));
  const maxPeriod = Math.max(...periodEntries.map(([, c]) => c), 1);
  const templateEntries = Object.entries(stats.by_template);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <ContentCard title="填报总数">
          <Statistic value={stats.total_submissions} suffix="条" />
        </ContentCard>
      </Col>
      <Col xs={24} sm={16}>
        <ContentCard title="按状态分布">
          {Object.entries(stats.by_status).map(([status, count]) => (
            <div key={status} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>{STATUS_LABELS[status] ?? status}</span>
                <span>{count} ({Math.round((count / statusTotal) * 100)}%)</span>
              </div>
              <Progress percent={Math.round((count / statusTotal) * 100)} showInfo={false} />
            </div>
          ))}
        </ContentCard>
      </Col>
      <Col xs={24} lg={12}>
        <ContentCard title="按周期分布">
          {periodEntries.length === 0 ? (
            <div style={{ color: "#94a3b8" }}>暂无数据</div>
          ) : (
            periodEntries.map(([period, count]) => (
              <div key={period} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{period}</span>
                  <span>{count}</span>
                </div>
                <Progress
                  percent={Math.round((count / maxPeriod) * 100)}
                  showInfo={false}
                  strokeColor="#0ea5e9"
                />
              </div>
            ))
          )}
        </ContentCard>
      </Col>
      <Col xs={24} lg={12}>
        <ContentCard title="按模板分布">
          {templateEntries.length === 0 ? (
            <div style={{ color: "#94a3b8" }}>暂无数据</div>
          ) : (
            templateEntries.map(([template, count]) => (
              <div key={template} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>{template}</span>
                <span>{count}</span>
              </div>
            ))
          )}
        </ContentCard>
      </Col>
    </Row>
  );
}

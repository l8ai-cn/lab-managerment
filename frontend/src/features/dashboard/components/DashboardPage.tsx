import { SafetyCertificateOutlined, DollarOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Progress, Row, Statistic } from "antd";
import { faultsApi } from "@/features/faults/api/faultsApi";
import { instrumentsApi } from "@/features/instruments/api/instrumentsApi";
import { dashboardApi } from "../api/dashboardApi";
import "./DashboardPage.css";

const STAT_COLORS = ["#38bdf8", "#a78bfa", "#fbbf24", "#2dd4bf", "#f87171", "#86efac"];

export function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: dashboardApi.overview,
    refetchInterval: 30_000,
  });

  const { data: trends } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: dashboardApi.trends,
    refetchInterval: 60_000,
  });

  const { data: faultStats } = useQuery({
    queryKey: ["dashboard-fault-stats"],
    queryFn: faultsApi.stats,
    refetchInterval: 60_000,
  });

  const { data: instrumentsData } = useQuery({
    queryKey: ["dashboard-instruments"],
    queryFn: () => instrumentsApi.list({ page_size: 500 }),
    refetchInterval: 120_000,
  });

  const maxBookings = Math.max(...(trends?.weekly.map((p) => p.bookings) ?? [1]), 1);
  const maxHours = Math.max(...(trends?.weekly.map((p) => p.usage_hours) ?? [1]), 1);

  const openRate = overview
    ? Math.round((overview.open_labs / Math.max(overview.total_labs, 1)) * 100)
    : 0;

  const assetTotal = (instrumentsData?.items ?? []).reduce(
    (sum, i) => sum + (i.purchase_price ?? 0),
    0,
  );

  const pendingFaults = faultStats?.by_status?.pending ?? overview?.pending_faults ?? 0;
  const processingFaults =
    (faultStats?.by_status?.assigned ?? 0) + (faultStats?.by_status?.processing ?? 0);
  const resolvedFaults = faultStats?.by_status?.resolved ?? 0;
  const safetyScore = Math.max(
    0,
    100 - pendingFaults * 5 - processingFaults * 2,
  );

  const stats = [
    { label: "实验室总数", value: overview?.total_labs ?? 0, extra: `开放率 ${openRate}%` },
    { label: "仪器设备", value: overview?.total_instruments ?? 0 },
    { label: "今日预约", value: overview?.today_bookings ?? 0 },
    { label: "进行中预约", value: overview?.active_bookings ?? 0 },
    { label: "待处理故障", value: overview?.pending_faults ?? 0 },
    { label: "在线用户", value: overview?.online_users_estimate ?? 0 },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__inner">
        <div className="dashboard__header">
          <h1 className="dashboard__title">实验室运行态势</h1>
          <span className="dashboard__time">
            <span className="dashboard__pulse" />
            实时刷新 · 每 30 秒更新
          </span>
        </div>

        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          {stats.map((stat, i) => (
            <Col xs={24} sm={12} lg={8} xl={4} key={stat.label}>
              <Card className="dashboard__card" bordered={false}>
                <Statistic
                  title={<span className="dashboard__stat-label">{stat.label}</span>}
                  value={stat.value}
                  valueStyle={{ color: STAT_COLORS[i % STAT_COLORS.length] }}
                  className="dashboard__stat-value"
                />
                {stat.extra && (
                  <Progress
                    percent={openRate}
                    size="small"
                    strokeColor="#10b981"
                    showInfo={false}
                    style={{ marginTop: 10 }}
                  />
                )}
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              className="dashboard__card"
              title={
                <span>
                  <SafetyCertificateOutlined style={{ marginRight: 8, color: "#10b981" }} />
                  安全态势
                </span>
              }
              bordered={false}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="安全评分" value={safetyScore} suffix="/ 100" valueStyle={{ color: "#10b981" }} />
                </Col>
                <Col span={8}>
                  <Statistic title="待处理" value={pendingFaults} valueStyle={{ color: "#f59e0b" }} />
                </Col>
                <Col span={8}>
                  <Statistic title="已解决" value={resolvedFaults} valueStyle={{ color: "#38bdf8" }} />
                </Col>
              </Row>
              <Progress
                percent={safetyScore}
                strokeColor={{ from: "#ef4444", to: "#10b981" }}
                style={{ marginTop: 16 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              className="dashboard__card"
              title={
                <span>
                  <DollarOutlined style={{ marginRight: 8, color: "#f59e0b" }} />
                  资产价值
                </span>
              }
              bordered={false}
            >
              <Statistic
                title="仪器设备资产总值"
                value={assetTotal}
                precision={2}
                prefix="¥"
                valueStyle={{ color: "#fbbf24", fontSize: 28 }}
              />
              <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
                共 {instrumentsData?.total ?? 0} 台设备 · 数据来自仪器台账
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card className="dashboard__card" title="近 7 日预约趋势" bordered={false}>
              {trends?.weekly.map((point) => (
                <div key={point.date} className="dashboard__trend-row">
                  <div className="dashboard__trend-meta">
                    <span className="dashboard__trend-date">{point.date}</span>
                    <span className="dashboard__trend-value">{point.bookings} 次</span>
                  </div>
                  <Progress
                    percent={Math.round((point.bookings / maxBookings) * 100)}
                    showInfo={false}
                    strokeColor="#0ea5e9"
                    trailColor="rgba(148, 163, 184, 0.1)"
                    size="small"
                  />
                </div>
              ))}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="dashboard__card" title="近 7 日使用时长 & 故障" bordered={false}>
              {trends?.weekly.map((point) => (
                <div key={point.date} className="dashboard__trend-row">
                  <div className="dashboard__trend-meta">
                    <span className="dashboard__trend-date">{point.date}</span>
                    <span>
                      <span style={{ color: "#2dd4bf", marginRight: 12 }}>{point.usage_hours}h</span>
                      <span style={{ color: "#f87171" }}>{point.faults} 故障</span>
                    </span>
                  </div>
                  <Progress
                    percent={Math.round((point.usage_hours / maxHours) * 100)}
                    showInfo={false}
                    strokeColor="#14b8a6"
                    trailColor="rgba(148, 163, 184, 0.1)"
                    size="small"
                  />
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

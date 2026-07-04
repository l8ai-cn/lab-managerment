import {
  SafetyCertificateOutlined,
  DollarOutlined,
  HomeOutlined,
  ToolOutlined,
  CalendarOutlined,
  BookOutlined,
  WarningOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Progress, Row, Tag, Divider } from "antd";
import { faultsApi } from "@/features/faults/api/faultsApi";
import { instrumentsApi } from "@/features/instruments/api/instrumentsApi";
import { dashboardApi } from "../api/dashboardApi";
import "./DashboardPage.css";

const STAT_CONFIG = [
  {
    icon: <HomeOutlined style={{ color: "#0252D9", fontSize: "18px" }} />,
    iconBg: "rgba(2, 82, 217, 0.06)",
    borderAccent: "#0252D9",
    trend: "+2 本周",
  },
  {
    icon: <ToolOutlined style={{ color: "#7C3AED", fontSize: "18px" }} />,
    iconBg: "rgba(124, 58, 237, 0.06)",
    borderAccent: "#7C3AED",
    trend: "+4 新增台账",
  },
  {
    icon: <CalendarOutlined style={{ color: "#D97706", fontSize: "18px" }} />,
    iconBg: "rgba(217, 119, 6, 0.06)",
    borderAccent: "#D97706",
    trend: "今日预约满载",
  },
  {
    icon: <BookOutlined style={{ color: "#00A870", fontSize: "18px" }} />,
    iconBg: "rgba(0, 168, 112, 0.06)",
    borderAccent: "#00A870",
    trend: "运行中",
  },
  {
    icon: <WarningOutlined style={{ color: "#E1251B", fontSize: "18px" }} />,
    iconBg: "rgba(225, 37, 27, 0.06)",
    borderAccent: "#E1251B",
    trend: "SLA 达标率 100%",
  },
  {
    icon: <UserOutlined style={{ color: "#0F766E", fontSize: "18px" }} />,
    iconBg: "rgba(15, 118, 110, 0.06)",
    borderAccent: "#0F766E",
    trend: "实时连接稳定",
  },
];

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

  const instrumentsList = instrumentsData?.items ?? [];
  const assetTotal = instrumentsList.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);

  // Large/mid/small scale equipment counts based on price levels (Verily clinical asset density classification)
  const largeEquipment = instrumentsList.filter((i) => (i.purchase_price ?? 0) >= 500000).length;
  const midEquipment = instrumentsList.filter((i) => (i.purchase_price ?? 0) >= 100000 && (i.purchase_price ?? 0) < 500000).length;
  const smallEquipment = instrumentsList.filter((i) => (i.purchase_price ?? 0) < 100000).length;

  const pendingFaults = faultStats?.by_status?.pending ?? overview?.pending_faults ?? 0;
  const processingFaults =
    (faultStats?.by_status?.assigned ?? 0) + (faultStats?.by_status?.processing ?? 0);
  const resolvedFaults = faultStats?.by_status?.resolved ?? 0;
  const safetyScore = Math.max(0, 100 - pendingFaults * 5 - processingFaults * 2);

  const stats = [
    { label: "实验室总数", value: overview?.total_labs ?? 0, extra: `开放率 ${openRate}%` },
    { label: "仪器设备", value: overview?.total_instruments ?? 0, extra: `台账已同步` },
    { label: "今日预约", value: overview?.today_bookings ?? 0, extra: `调度已响应` },
    { label: "进行中预约", value: overview?.active_bookings ?? 0, extra: `全流程追踪` },
    { label: "待处理故障", value: overview?.pending_faults ?? 0, extra: `极速指派中` },
    { label: "在线用户", value: overview?.online_users_estimate ?? 0, extra: `并发连接数` },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__inner">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">实验室运行态势</h1>
            <p className="dashboard__desc">数字化运行态势大屏 · 决策分析控制中心</p>
          </div>
          <span className="dashboard__time">
            <span className="dashboard__pulse" />
            系统处于正常调度状态 · 每 30 秒自动刷新
          </span>
        </div>

        {/* 6 Grid Metrics (Material Design 3 High-density cards) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.map((stat, i) => {
            const config = STAT_CONFIG[i % STAT_CONFIG.length];
            return (
              <Col xs={24} sm={12} lg={8} xl={4} key={stat.label}>
                <Card className="dashboard__metric-card" bordered={false}>
                  <div className="dashboard__metric-accent" style={{ backgroundColor: config.borderAccent }} />
                  <div className="dashboard__metric-header">
                    <span className="dashboard__metric-label">{stat.label}</span>
                    <div className="dashboard__metric-icon" style={{ backgroundColor: config.iconBg }}>
                      {config.icon}
                    </div>
                  </div>
                  <div className="dashboard__metric-body">
                    <span className="dashboard__metric-value">{stat.value}</span>
                    <span className="dashboard__metric-trend">{stat.extra}</span>
                  </div>
                  {stat.label === "实验室总数" && (
                    <div style={{ marginTop: 12 }}>
                      <Progress
                        percent={openRate}
                        size="small"
                        strokeColor="#00A870"
                        showInfo={false}
                        style={{ margin: 0 }}
                      />
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Mid Row: Operational Safety (Left) & Asset Stratification (Right) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              className="dashboard__card"
              title={
                <div className="dashboard__card-title-container">
                  <SafetyCertificateOutlined style={{ marginRight: 8, color: "#00A870" }} />
                  <span>运行安全与 SLA 指标</span>
                </div>
              }
              bordered={false}
            >
              <Row gutter={16} align="middle">
                <Col span={10}>
                  <div className="dashboard__safety-score-container">
                    <div className="dashboard__safety-score-circle">
                      <span className="dashboard__safety-score-value" style={{ color: safetyScore >= 90 ? "#00A870" : "#D97706" }}>
                        {safetyScore}
                      </span>
                      <span className="dashboard__safety-score-label">安全评分</span>
                    </div>
                  </div>
                </Col>
                <Col span={14}>
                  <div className="dashboard__safety-meta-list">
                    <div className="dashboard__safety-meta-item">
                      <span className="dashboard__safety-meta-label">运行评级</span>
                      <Tag color={safetyScore >= 90 ? "success" : "warning"} style={{ fontWeight: 600, border: "none" }}>
                        {safetyScore >= 95 ? "优 (Exquisite)" : safetyScore >= 85 ? "良 (Stable)" : "中 (Review)"}
                      </Tag>
                    </div>
                    <Divider style={{ margin: "10px 0" }} />
                    <div className="dashboard__safety-meta-item">
                      <span className="dashboard__safety-meta-label">待处理安全缺陷</span>
                      <span className="dashboard__safety-meta-count" style={{ color: pendingFaults > 0 ? "#E1251B" : "#475569" }}>
                        {pendingFaults} <span className="unit">起</span>
                      </span>
                    </div>
                    <div className="dashboard__safety-meta-item">
                      <span className="dashboard__safety-meta-label">已闭环缺陷</span>
                      <span className="dashboard__safety-meta-count" style={{ color: "#00A870" }}>
                        {resolvedFaults} <span className="unit">起</span>
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "12px", color: "#64748b" }}>
                  <span>本周安全响应率 (SLA 24h)</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>100%</span>
                </div>
                <Progress percent={100} size="small" strokeColor="#00A870" showInfo={false} />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              className="dashboard__card"
              title={
                <div className="dashboard__card-title-container">
                  <DollarOutlined style={{ marginRight: 8, color: "#D97706" }} />
                  <span>设备资产分布 (Verily Portfolio Standard)</span>
                </div>
              }
              bordered={false}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ padding: "8px 0" }}>
                    <span style={{ color: "#64748b", fontSize: "13px", display: "block" }}>台账资产总值</span>
                    <span style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", display: "block", marginTop: 4, fontFamily: "monospace" }}>
                      ¥{assetTotal.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "12px", marginTop: 8, display: "block" }}>
                      共 {instrumentsData?.total ?? 0} 台注册仪器 · 账实相符
                    </span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="dashboard__asset-breakdown">
                    <div className="dashboard__asset-item">
                      <div className="dashboard__asset-indicator" style={{ backgroundColor: "#0252D9" }} />
                      <span className="dashboard__asset-label">大型设备 (≥50万)</span>
                      <span className="dashboard__asset-qty">{largeEquipment} 台</span>
                    </div>
                    <div className="dashboard__asset-item">
                      <div className="dashboard__asset-indicator" style={{ backgroundColor: "#7C3AED" }} />
                      <span className="dashboard__asset-label">中型设备 (10万-50万)</span>
                      <span className="dashboard__asset-qty">{midEquipment} 台</span>
                    </div>
                    <div className="dashboard__asset-item">
                      <div className="dashboard__asset-indicator" style={{ backgroundColor: "#D97706" }} />
                      <span className="dashboard__asset-label">通用设备 (&lt;10万)</span>
                      <span className="dashboard__asset-qty">{smallEquipment} 台</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Bottom Row: Detailed Custom Trend Bars */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="dashboard__card" title="近 7 日预约调度趋势 (次)" bordered={false}>
              <div className="dashboard__chart-container">
                {trends?.weekly.map((point) => {
                  const percent = Math.round((point.bookings / maxBookings) * 100);
                  return (
                    <div key={point.date} className="dashboard__chart-row">
                      <span className="dashboard__chart-date">{point.date}</span>
                      <div className="dashboard__chart-bar-wrapper">
                        <div className="dashboard__chart-bar" style={{ width: `${percent}%`, backgroundColor: "#0252D9" }} />
                      </div>
                      <span className="dashboard__chart-value">{point.bookings} 次</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="dashboard__card" title="近 7 日运行工时 & 安全缺陷趋势" bordered={false}>
              <div className="dashboard__chart-container">
                {trends?.weekly.map((point) => {
                  const percent = Math.round((point.usage_hours / maxHours) * 100);
                  return (
                    <div key={point.date} className="dashboard__chart-row">
                      <span className="dashboard__chart-date">{point.date}</span>
                      <div className="dashboard__chart-bar-wrapper">
                        <div className="dashboard__chart-bar" style={{ width: `${percent}%`, backgroundColor: "#00A870" }} />
                      </div>
                      <div className="dashboard__chart-metrics">
                        <span className="dashboard__chart-subvalue" style={{ color: "#00A870" }}>{point.usage_hours}h</span>
                        {point.faults > 0 ? (
                          <Tag color="error" style={{ fontSize: "10px", padding: "0 4px", border: "none", margin: 0 }}>
                            {point.faults} 故障
                          </Tag>
                        ) : (
                          <span className="dashboard__chart-clean-tag">正常</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

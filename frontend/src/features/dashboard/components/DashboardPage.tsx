import { useQuery } from "@tanstack/react-query";
import { Card, Col, Progress, Row, Statistic } from "antd";
import { dashboardApi } from "../api/dashboardApi";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
};

const statStyle = { color: "#fff" };

export function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: dashboardApi.overview,
    refetchInterval: 30000,
  });

  const { data: trends } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: dashboardApi.trends,
    refetchInterval: 60000,
  });

  const maxBookings = Math.max(...(trends?.weekly.map((p) => p.bookings) ?? [1]), 1);
  const maxHours = Math.max(...(trends?.weekly.map((p) => p.usage_hours) ?? [1]), 1);

  const openRate = overview
    ? Math.round((overview.open_labs / Math.max(overview.total_labs, 1)) * 100)
    : 0;

  return (
    <div
      style={{
        padding: 24,
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d1f3c 100%)",
        color: "#fff",
      }}
    >
      <h1 style={{ color: "#fff", marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
        实验室管理可视化大屏
      </h1>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={cardStyle} bordered={false}>
            <Statistic
              title={<span style={statStyle}>实验室总数</span>}
              value={overview?.total_labs ?? 0}
              valueStyle={{ color: "#69b1ff", fontSize: 36 }}
            />
            <Progress
              percent={openRate}
              size="small"
              strokeColor="#52c41a"
              format={() => `开放 ${overview?.open_labs ?? 0}`}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bordered={false}>
            <Statistic
              title={<span style={statStyle}>仪器设备</span>}
              value={overview?.total_instruments ?? 0}
              valueStyle={{ color: "#b37feb", fontSize: 36 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bordered={false}>
            <Statistic
              title={<span style={statStyle}>今日预约</span>}
              value={overview?.today_bookings ?? 0}
              valueStyle={{ color: "#ffc53d", fontSize: 36 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bordered={false}>
            <Statistic
              title={<span style={statStyle}>进行中预约</span>}
              value={overview?.active_bookings ?? 0}
              valueStyle={{ color: "#36cfc9", fontSize: 36 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bordered={false}>
            <Statistic
              title={<span style={statStyle}>待处理故障</span>}
              value={overview?.pending_faults ?? 0}
              valueStyle={{ color: "#ff7875", fontSize: 36 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bordered={false}>
            <Statistic
              title={<span style={statStyle}>在线用户（估算）</span>}
              value={overview?.online_users_estimate ?? 0}
              valueStyle={{ color: "#95de64", fontSize: 36 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col span={12}>
          <Card
            title={<span style={{ color: "#fff" }}>近7日预约趋势</span>}
            style={cardStyle}
            bordered={false}
          >
            {trends?.weekly.map((point) => (
              <div key={point.date} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.65)" }}>{point.date}</span>
                  <span style={{ color: "#69b1ff" }}>{point.bookings} 次</span>
                </div>
                <Progress
                  percent={Math.round((point.bookings / maxBookings) * 100)}
                  showInfo={false}
                  strokeColor="#1677ff"
                  trailColor="rgba(255,255,255,0.08)"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<span style={{ color: "#fff" }}>近7日使用时长 & 故障</span>}
            style={cardStyle}
            bordered={false}
          >
            {trends?.weekly.map((point) => (
              <div key={point.date} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.65)" }}>{point.date}</span>
                  <span>
                    <span style={{ color: "#36cfc9", marginRight: 12 }}>
                      {point.usage_hours}h
                    </span>
                    <span style={{ color: "#ff7875" }}>{point.faults} 故障</span>
                  </span>
                </div>
                <Progress
                  percent={Math.round((point.usage_hours / maxHours) * 100)}
                  showInfo={false}
                  strokeColor="#13c2c2"
                  trailColor="rgba(255,255,255,0.08)"
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

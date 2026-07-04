import { useQuery } from "@tanstack/react-query";
import { Button, Input, List, Spin, Tag } from "antd";
import { Link, Route, Routes } from "react-router-dom";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import { faultsApi } from "@/features/faults/api/faultsApi";
import { labBookingsApi, LAB_BOOKING_STATUS_COLORS, LAB_BOOKING_STATUS_LABELS } from "@/features/lab-bookings/api/labBookingsApi";
import { labsApi } from "@/features/labs/api/labsApi";
import { OPEN_STATUS_COLORS, OPEN_STATUS_LABELS } from "@/features/labs/types/lab";
import { MobileShell } from "./MobileShell";
import "./MobileShell.css";

function MobileDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-dashboard"],
    queryFn: dashboardApi.overview,
  });

  if (isLoading) return <Spin style={{ display: "block", margin: "48px auto" }} />;

  return (
    <div>
      <div className="mobile-card">
        <div className="mobile-card__title">今日预约</div>
        <div className="mobile-card__value">{data?.today_bookings ?? 0}</div>
      </div>
      <div className="mobile-card">
        <div className="mobile-card__title">进行中预约</div>
        <div className="mobile-card__value" style={{ color: "#10b981" }}>
          {data?.active_bookings ?? 0}
        </div>
      </div>
      <div className="mobile-card">
        <div className="mobile-card__title">待处理故障</div>
        <div className="mobile-card__value" style={{ color: "#ef4444" }}>
          {data?.pending_faults ?? 0}
        </div>
      </div>
    </div>
  );
}

function MobileLabs() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-labs"],
    queryFn: () => labsApi.list({ page_size: 20 }),
  });

  if (isLoading) return <Spin style={{ display: "block", margin: "48px auto" }} />;

  return (
    <List
      dataSource={data?.items}
      renderItem={(lab) => (
        <div className="mobile-card">
          <div className="mobile-card__title">{lab.name}</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{lab.code}</div>
          <Tag color={OPEN_STATUS_COLORS[lab.open_status]} style={{ marginTop: 8 }}>
            {OPEN_STATUS_LABELS[lab.open_status]}
          </Tag>
        </div>
      )}
    />
  );
}

function MobileBookings() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-bookings"],
    queryFn: () => labBookingsApi.list({ page_size: 20 }),
  });

  if (isLoading) return <Spin style={{ display: "block", margin: "48px auto" }} />;

  return (
    <List
      dataSource={data?.items}
      renderItem={(b) => (
        <div className="mobile-card">
          <div className="mobile-card__title">{b.lab_name}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {new Date(b.start_time).toLocaleString()} — {new Date(b.end_time).toLocaleString()}
          </div>
          <Tag color={LAB_BOOKING_STATUS_COLORS[b.status]} style={{ marginTop: 8 }}>
            {LAB_BOOKING_STATUS_LABELS[b.status]}
          </Tag>
        </div>
      )}
    />
  );
}

function MobileFaults() {
  const { data, isLoading } = useQuery({
    queryKey: ["mobile-faults"],
    queryFn: () => faultsApi.list({ page_size: 20 }),
  });

  if (isLoading) return <Spin style={{ display: "block", margin: "48px auto" }} />;

  return (
    <>
      <Link to="/fault-report">
        <Button type="primary" block style={{ marginBottom: 16 }}>
          上报故障
        </Button>
      </Link>
      <List
        dataSource={data?.items}
        renderItem={(f) => (
          <div className="mobile-card">
            <div className="mobile-card__title">{f.fault_type}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{f.lab_name}</div>
          </div>
        )}
      />
    </>
  );
}

function MobileScan() {
  return (
    <div className="mobile-card" style={{ textAlign: "center", padding: 32 }}>
      <div className="mobile-card__title">扫码签到 / 故障上报</div>
      <p style={{ color: "#64748b", margin: "16px 0" }}>
        扫描实验室二维码可快速进入故障上报或签到页面
      </p>
      <Input placeholder="输入或粘贴 lab_id" id="mobile-scan-input" style={{ marginBottom: 16 }} />
      <Button
        type="primary"
        block
        onClick={() => {
          const input = document.getElementById("mobile-scan-input") as HTMLInputElement;
          const labId = input?.value?.trim();
          if (labId) window.location.href = `/fault-report?lab_id=${labId}`;
        }}
      >
        打开故障上报
      </Button>
      <Link to="/lab-bookings" style={{ display: "block", marginTop: 12 }}>
        <Button block>查看实验室预约</Button>
      </Link>
    </div>
  );
}

export function MobileApp() {
  return (
    <Routes>
      <Route element={<MobileShell />}>
        <Route path="dashboard" element={<MobileDashboard />} />
        <Route path="labs" element={<MobileLabs />} />
        <Route path="bookings" element={<MobileBookings />} />
        <Route path="faults" element={<MobileFaults />} />
        <Route path="scan" element={<MobileScan />} />
        <Route index element={<MobileDashboard />} />
      </Route>
    </Routes>
  );
}

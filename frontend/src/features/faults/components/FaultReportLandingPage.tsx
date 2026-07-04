import { WarningOutlined } from "@ant-design/icons";
import { Button, Result } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { FaultReportForm } from "@/features/faults/components/FaultList";
import { useState } from "react";
import "./FaultReportLandingPage.css";

export function FaultReportLandingPage() {
  const [searchParams] = useSearchParams();
  const labId = searchParams.get("lab_id") ?? undefined;
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(true);

  return (
    <div className="fault-landing">
      <div className="fault-landing__card">
        <div className="fault-landing__header">
          <WarningOutlined className="fault-landing__icon" />
          <h1>实验室故障上报</h1>
          <p>扫码进入后可快速上报设备或环境故障{labId ? "，已自动关联实验室" : ""}</p>
        </div>

        {!user ? (
          <Result
            status="info"
            title="请先登录"
            subTitle="登录后即可提交故障报告"
            extra={
              <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                <Button type="primary">前往登录</Button>
              </Link>
            }
          />
        ) : (
          <div className="fault-landing__actions">
            <Button type="primary" size="large" onClick={() => setReportOpen(true)}>
              立即上报故障
            </Button>
            <Link to="/faults">
              <Button size="large">查看我的故障</Button>
            </Link>
          </div>
        )}
      </div>

      <FaultReportForm
        open={reportOpen && !!user}
        onClose={() => setReportOpen(false)}
        defaultLabId={labId}
      />
    </div>
  );
}

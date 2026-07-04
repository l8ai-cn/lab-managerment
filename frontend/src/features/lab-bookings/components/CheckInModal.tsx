import { QrcodeOutlined } from "@ant-design/icons";
import { Modal, Typography } from "antd";
import type { AccessGrant } from "../api/labBookingsApi";

interface CheckInModalProps {
  open: boolean;
  onClose: () => void;
  labName?: string;
  grants: AccessGrant[];
}

export function CheckInModal({ open, onClose, labName, grants }: CheckInModalProps) {
  const grant = grants[0];

  return (
    <Modal
      title="预约已通过 — 门禁授权"
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div style={{ textAlign: "center" }}>
        <Typography.Paragraph type="secondary">
          {labName ? `${labName} · ` : ""}请使用以下二维码或令牌签到进入实验室
        </Typography.Paragraph>
        {grant ? (
          <>
            <div style={{ margin: "16px 0" }}>
              <QrcodeOutlined style={{ fontSize: 48, color: "#0252D9" }} />
              <img
                alt="门禁二维码"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(grant.access_token)}`}
                width={180}
                height={180}
                style={{ display: "block", margin: "12px auto" }}
              />
            </div>
            <Typography.Paragraph copyable={{ text: grant.access_token }}>
              <strong>访问令牌：</strong>
              {grant.access_token}
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              授权方式：{grant.access_method} · 有效期至{" "}
              {new Date(grant.expires_at).toLocaleString()}
            </Typography.Text>
          </>
        ) : (
          <Typography.Text type="warning">暂未生成门禁授权，请联系管理员</Typography.Text>
        )}
      </div>
    </Modal>
  );
}

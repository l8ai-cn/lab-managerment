import { ArrowLeftOutlined, EditOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Descriptions, Modal, Space, Tag, Typography, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { faultsApi } from "@/features/faults/api/faultsApi";
import { usersApi } from "@/features/users/api/usersApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { labsApi } from "../api/labsApi";
import { LAB_TYPE_LABELS, INSPECTION_STATUS_COLORS, INSPECTION_STATUS_LABELS, OPEN_STATUS_COLORS, OPEN_STATUS_LABELS } from "../types/lab";

export function LabDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lab", id],
    queryFn: () => labsApi.get(id!),
    enabled: !!id,
  });

  const { data: qrData } = useQuery({
    queryKey: ["lab-fault-qr", id],
    queryFn: () => faultsApi.getLabQr(id!),
    enabled: !!id,
  });

  const { data: managerData } = useQuery({
    queryKey: ["lab-manager", data?.manager_id],
    queryFn: () => usersApi.get(data!.manager_id!),
    enabled: !!data?.manager_id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => labsApi.delete(id!),
    onSuccess: () => {
      message.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      navigate("/labs");
    },
  });

  const showQr = () => {
    if (!qrData) return;
    const fullUrl = `${window.location.origin}${qrData.url}`;
    Modal.info({
      title: "故障上报二维码",
      width: 360,
      content: (
        <div style={{ textAlign: "center" }}>
          <img
            alt="故障上报二维码"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}`}
            width={200}
            height={200}
          />
          <Typography.Paragraph copyable style={{ marginTop: 12, fontSize: 12 }}>
            {fullUrl}
          </Typography.Paragraph>
          <Typography.Text type="secondary">扫码后将自动关联本实验室</Typography.Text>
        </div>
      ),
    });
  };

  if (isLoading || !data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={data.code}
        breadcrumb={[
          { title: "实验室管理" },
          { title: "实验室", path: "/labs" },
          { title: data.code },
        ]}
        extra={
          <Space>
            <Button icon={<QrcodeOutlined />} onClick={showQr}>
              故障二维码
            </Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/labs/${id}/edit`)}>
              编辑
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/labs")}>
              返回列表
            </Button>
            <Button danger loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              删除
            </Button>
          </Space>
        }
      />

      <ContentCard
        title={
          <Space>
            <span>{data.code}</span>
            <Tag color={OPEN_STATUS_COLORS[data.open_status]}>
              {OPEN_STATUS_LABELS[data.open_status]}
            </Tag>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="名称" span={2}>{data.name}</Descriptions.Item>
          <Descriptions.Item label="楼栋">{data.building_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="楼层">{data.floor_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="房间">{data.room_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="具体位置">{data.location_detail || "-"}</Descriptions.Item>
          <Descriptions.Item label="类型">
            {data.lab_type ? LAB_TYPE_LABELS[data.lab_type] : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="巡查状态">
            <Tag color={INSPECTION_STATUS_COLORS[data.inspection_status]}>
              {INSPECTION_STATUS_LABELS[data.inspection_status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="面积(㎡)">{data.area_sqm ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="容纳人数">{data.capacity ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="管理员">{managerData?.name ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="功能分区" span={2}>
            {data.functional_zones?.join("、") || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{data.description || "-"}</Descriptions.Item>
        </Descriptions>
      </ContentCard>
    </>
  );
}

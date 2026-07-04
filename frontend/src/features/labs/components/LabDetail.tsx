import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Descriptions, message, Space, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { labsApi } from "../api/labsApi";
import { LAB_TYPE_LABELS, OPEN_STATUS_COLORS, OPEN_STATUS_LABELS } from "../types/lab";

export function LabDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lab", id],
    queryFn: () => labsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => labsApi.delete(id!),
    onSuccess: () => {
      message.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      navigate("/labs");
    },
  });

  if (isLoading || !data) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <span>{data.code}</span>
          <Tag color={OPEN_STATUS_COLORS[data.open_status]}>
            {OPEN_STATUS_LABELS[data.open_status]}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button danger loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            删除
          </Button>
          <Button onClick={() => navigate("/labs")}>返回列表</Button>
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
        <Descriptions.Item label="面积(㎡)">{data.area_sqm ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="容纳人数">{data.capacity ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="功能分区" span={2}>
          {data.functional_zones?.join("、") || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{data.description || "-"}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

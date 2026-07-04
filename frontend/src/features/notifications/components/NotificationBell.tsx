import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Dropdown, List, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { notificationsApi } from "../api/notificationsApi";

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60000,
  });

  const { data: listData } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationsApi.list({ limit: 20 }),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const dropdownContent = (
    <div
      style={{
        width: 360,
        maxHeight: 400,
        overflow: "auto",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
      }}
    >
      <List
        size="small"
        header={
          <div style={{ padding: "8px 16px", fontWeight: 600 }}>
            通知消息
            {countData?.count ? (
              <span style={{ marginLeft: 8, color: "#1677ff" }}>({countData.count} 未读)</span>
            ) : null}
          </div>
        }
        dataSource={listData?.items ?? []}
        locale={{ emptyText: "暂无通知" }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              background: item.is_read ? undefined : "rgba(22,119,255,0.06)",
            }}
            onClick={() => {
              if (!item.is_read) markReadMutation.mutate(item.id);
            }}
          >
            <List.Item.Meta
              title={
                <Typography.Text strong={!item.is_read}>{item.title}</Typography.Text>
              }
              description={
                <>
                  <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                    {dayjs(item.created_at).format("MM-DD HH:mm")} · {item.category}
                  </div>
                  <div style={{ marginTop: 4 }}>{item.content}</div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown dropdownRender={() => dropdownContent} trigger={["click"]} placement="bottomRight">
      <Badge count={countData?.count ?? 0} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, color: "#fff", cursor: "pointer" }} />
      </Badge>
    </Dropdown>
  );
}

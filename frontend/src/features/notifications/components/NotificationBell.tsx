import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Dropdown, Empty, List, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { notificationsApi } from "../api/notificationsApi";
import "./NotificationBell.css";

const CATEGORY_LABELS: Record<string, string> = {
  booking: "预约",
  usage: "使用记录",
  fault: "故障",
  system: "系统",
};

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
  });

  const { data: listData, isLoading } = useQuery({
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
    <div className="notification-panel">
      <div className="notification-panel__header">
        <span className="notification-panel__title">通知消息</span>
        {countData?.count ? (
          <span className="notification-panel__badge">{countData.count} 条未读</span>
        ) : null}
      </div>
      <List
        size="small"
        loading={isLoading}
        dataSource={listData?.items ?? []}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" /> }}
        renderItem={(item) => (
          <List.Item
            className={`notification-panel__item ${item.is_read ? "" : "notification-panel__item--unread"}`}
            onClick={() => {
              if (!item.is_read) markReadMutation.mutate(item.id);
            }}
          >
            <List.Item.Meta
              title={
                <div className="notification-panel__item-title">
                  <Typography.Text strong={!item.is_read}>{item.title}</Typography.Text>
                  <span className="notification-panel__category">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                </div>
              }
              description={
                <>
                  <div className="notification-panel__time">
                    {dayjs(item.created_at).format("YYYY-MM-DD HH:mm")}
                  </div>
                  <div className="notification-panel__content">{item.content}</div>
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
        <BellOutlined className="notification-bell__icon" />
      </Badge>
    </Dropdown>
  );
}

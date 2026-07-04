import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, Alert, message } from "antd";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username.trim(), values.password);
      message.success("登录成功，欢迎回来！");
    } catch {
      message.error("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <div className="login-page__header">
          <h1 className="login-page__title">实验室管理系统</h1>
          <p className="login-page__subtitle">LabOS 实验室数字化管理平台</p>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
            initialValue="admin"
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
            initialValue="admin123"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-page__submit"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Alert
          message={
            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
              <strong>演示账号</strong>
              <br />
              用户名：<code>admin</code> / 密码：<code>admin123</code>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 24, borderRadius: "6px" }}
        />
      </div>
    </div>
  );
}

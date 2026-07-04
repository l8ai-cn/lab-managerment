import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, message } from "antd";
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
        <div className="login-page__brand-stripe" />
        
        <div className="login-page__card-inner">
          <div className="login-page__logo">
            <div className="login-page__logo-icon">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 22H22L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>

          <h1 className="login-page__title">实验室管理系统</h1>
          <p className="login-page__subtitle">LabOS 实验室数字化管理平台</p>

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

            <Form.Item style={{ marginBottom: 0, marginTop: 20 }}>
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

          <Divider plain style={{ margin: "24px 0 16px", color: "#94a3b8", fontSize: "13px" }}>
            统一身份认证
          </Divider>

          <Button
            block
            size="large"
            href="/api/v1/auth/sso/login"
            className="login-page__sso"
          >
            SSO 单点登录
          </Button>
        </div>

        <div className="login-page__footer">
          <div className="login-page__hint-title">演示账号</div>
          <div className="login-page__hint-grid">
            <div className="login-page__hint-item">
              账号: <code>admin</code>
            </div>
            <div className="login-page__hint-item">
              密码: <code>admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

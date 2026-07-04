import { ExperimentOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, message } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import "./LoginPage.css";

type BackendStatus = "loading" | "ok" | "error";

function getLoginError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "无法连接服务器，请确认后端已启动（端口 8000）";
    }
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (err.response.status === 401) return "用户名或密码错误";
    return `登录失败（${err.response.status}）`;
  }
  return "登录失败，请稍后重试";
}

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    fetch("/health")
      .then((r) => (r.ok ? setBackendStatus("ok") : setBackendStatus("error")))
      .catch(() => setBackendStatus("error"));
  }, []);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onFinish = async (values: { username: string; password: string }) => {
    if (backendStatus === "error") {
      message.error("后端服务未启动，请先运行后端");
      return;
    }
    setLoading(true);
    try {
      await login(values.username.trim(), values.password);
      message.success("欢迎回来！");
    } catch (err) {
      message.error(getLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  const statusText = {
    loading: "正在检测服务状态…",
    ok: "服务已就绪，可以登录",
    error: "后端未连接 — 请在 backend 目录运行 uvicorn",
  }[backendStatus];

  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-page__grid" />

      <div className="login-page__content">
        <aside className="login-page__brand">
          <div className="login-page__logo">
            <div className="login-page__logo-icon">
              <ExperimentOutlined />
            </div>
            <span className="login-page__logo-text">LabOS · 实验室管理平台</span>
          </div>

          <h1 className="login-page__headline">
            智慧调度
            <br />
            高效管理
          </h1>
          <p className="login-page__subtitle">
            覆盖实验室信息、设备预约、仪器调度、故障上报与数据分析，
            助力高校实验室数字化转型升级。
          </p>

          <ul className="login-page__features">
            {["实验室全生命周期管理", "仪器与实验室在线预约", "多级审批与使用追踪", "可视化运行态势大屏"].map(
              (text) => (
                <li key={text} className="login-page__feature">
                  <span className="login-page__feature-dot" />
                  {text}
                </li>
              ),
            )}
          </ul>
        </aside>

        <main className="login-page__panel">
          <div className="login-page__card">
            <div className="login-page__mobile-brand">
              <div className="login-page__logo-icon">
                <ExperimentOutlined style={{ color: "#fff" }} />
              </div>
              <span>实验室管理系统</span>
            </div>

            <h2 className="login-page__card-title">欢迎登录</h2>
            <p className="login-page__card-desc">请输入您的账号信息以继续</p>

            <div className={`login-page__status login-page__status--${backendStatus}`}>
              <span className="login-page__status-dot" />
              {statusText}
            </div>

            <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: "请输入用户名" }]}
                initialValue="admin"
              >
                <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} placeholder="admin" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="admin123"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="login-page__submit"
                  disabled={backendStatus === "error"}
                >
                  登 录
                </Button>
              </Form.Item>
            </Form>

            <Divider plain style={{ margin: "20px 0 16px", color: "#94a3b8", fontSize: 13 }}>
              或使用统一身份认证
            </Divider>
            <Button
              block
              size="large"
              href="/api/v1/auth/sso/login"
              className="login-page__sso"
            >
              SSO 单点登录
            </Button>

            <div className="login-page__hint">
              <strong>演示账号</strong>
              <br />
              用户名：<code>admin</code>（不区分大小写）
              <br />
              密码：<code>admin123</code>（全小写）
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { ConfigProvider, App } from "antd";
import zhCN from "antd/locale/zh_CN";

/**
 * Antd 全局配置
 *
 * 提供中文 locale 和主题定制。
 * 包裹 App 组件以启用 App.useApp()（静态 message/modal 等）。
 */
export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          borderRadius: 6,
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}

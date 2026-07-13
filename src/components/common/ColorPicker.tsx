"use client";

import { ColorPicker as AntdColorPicker } from "antd";

// 预设颜色面板
const PRESETS = [
  {
    label: "预设",
    colors: [
      "#1890ff", "#52c41a", "#faad14", "#f5222d",
      "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16",
      "#000000", "#595959", "#8c8c8c", "#d9d9d9",
    ],
  },
];

/**
 * 颜色选择器封装
 *
 * 将 Antd ColorPicker 的 AggregationColor 转换为 #RRGGBB 字符串
 */
export default function ColorPicker({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (color: string) => void;
  children: React.ReactNode;
}) {
  return (
    <AntdColorPicker
      value={value}
      onChange={(value) => onChange(value.toHexString())}
      presets={PRESETS}
      size="small"
    >
      {children}
    </AntdColorPicker>
  );
}

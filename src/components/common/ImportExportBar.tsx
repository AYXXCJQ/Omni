"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, App } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import type { NodeData } from "@/types";

export default function ImportExportBar({
  onImported,
}: {
  onImported: (nodes: NodeData[]) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("导出请求失败");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omni-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("导出成功");
    } catch {
      message.error("导出失败");
    }
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.nodes || !Array.isArray(data.nodes)) {
          message.error("无效的文件格式：缺少 nodes 数组");
          return;
        }
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "导入失败");
        }
        const result = await res.json();
        onImported(result.nodes);
        message.success(`成功导入 ${result.count} 个节点`);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "导入失败，请检查文件格式");
      }
      document.body.removeChild(input);
    });
    document.body.appendChild(input);
    input.click();
  };

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", gap: 8 }}>
      <Button icon={<UploadOutlined />} onClick={handleImportClick}>
        导入
      </Button>
      <Button icon={<DownloadOutlined />} onClick={handleExport}>
        导出
      </Button>
    </div>,
    document.body
  );
}

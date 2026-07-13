"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer, Input, Button, Radio, Divider } from "antd";
import { DeleteOutlined, FileTextOutlined, CheckSquareOutlined } from "@ant-design/icons";
import LazyEditor from "./LazyEditor";
import TodoList from "@/components/todo/TodoList";
import ColorPicker from "@/components/common/ColorPicker";
import FileUpload from "@/components/common/FileUpload";
import { useNodeStore } from "@/store/nodeStore";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import type { NodeData } from "@/types";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * 节点详情抽屉
 *
 * 编辑节点标题、类型（通用/待办）、颜色、富文本内容、待办列表、文件附件
 * 使用 Antd v6 的 resizable Drawer
 */
export default function NodeDetailPanel({
  node,
  open,
  onClose,
  onDelete,
}: {
  node: NodeData | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const updateNodePartial = useNodeStore((s) => s.updateNodePartial);
  const nodeIdRef = useRef(node?.id);
  const [width, setWidth] = useState(480);

  // 跟踪 node.id 变化，确保防抖回调使用最新 ID
  useEffect(() => {
    nodeIdRef.current = node?.id;
  }, [node?.id]);

  // 防抖同步：输入类字段延迟 500ms 写入服务端
  const syncField = useDebouncedCallback(
    async (field: string, value: unknown) => {
      const id = nodeIdRef.current;
      if (!id) return;
      try {
        await fetch(`/api/nodes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
      } catch {}
    },
    500
  );

  const debouncedUpdate = (field: string, value: unknown) => {
    if (!node) return;
    updateNodePartial(node.id, { [field]: value });
    syncField(field, value);
  };

  // 即时同步：颜色/类型等变更立即写入服务端
  const immediateUpdate = async (field: string, value: unknown) => {
    if (!node) return;
    updateNodePartial(node.id, { [field]: value });
    try {
      await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch {}
  };

  if (!node) return null;

  return (
    <Drawer
      title={
        <Input
          variant="borderless"
          value={node.title}
          onChange={(e) => debouncedUpdate("title", e.target.value)}
          placeholder="节点标题"
          className="text-lg font-semibold -ml-2"
        />
      }
      open={open}
      onClose={onClose}
      size={width}
      resizable={{ onResize: (w) => setWidth(w) }}
      styles={{ body: { display: "flex", flexDirection: "column", height: "100%" } }}
      extra={
        <div className="flex items-center gap-2">
          <ColorPicker
            value={node.color}
            onChange={(color) => immediateUpdate("color", color)}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: node.color,
                cursor: "pointer",
                border: "2px solid #e8e8e8",
              }}
            />
          </ColorPicker>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={onDelete}
            size="small"
          />
        </div>
      }
    >
      {/* 节点类型切换 */}
      <div className="shrink-0 mb-4">
        <div className="text-xs text-gray-400 mb-2">节点类型</div>
        <Radio.Group
          value={node.type}
          onChange={(e) => immediateUpdate("type", e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="general">
            <FileTextOutlined /> 通用
          </Radio.Button>
          <Radio.Button value="todo">
            <CheckSquareOutlined /> 待办
          </Radio.Button>
        </Radio.Group>
      </div>

      <Divider className="shrink-0" style={{ margin: "0 0 12px" }} />

      {/* 通用节点显示富文本编辑器，待办节点显示待办列表 */}
      {node.type === "general" ? (
        <div className="flex-1 min-h-0 mb-4 flex flex-col">
          <div className="text-xs text-gray-400 mb-1 shrink-0">内容</div>
          <LazyEditor
            content={node.content}
            onChange={(html) => debouncedUpdate("content", html)}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
          <div className="text-xs text-gray-400 mb-1">待办</div>
          <TodoList nodeId={node.id} todos={node.todos || []} />
        </div>
      )}

      <Divider className="shrink-0" style={{ margin: "0 0 12px" }} />

      {/* 文件附件区域 */}
      <div className="shrink-0">
        <div className="text-xs text-gray-400 mb-1">附件</div>
        <FileUpload
          nodeId={node.id}
          onSuccess={(attachment) => {
            updateNodePartial(node.id, {
              files: [...(node.files || []), attachment],
            });
          }}
        />
        {(node.files?.length ?? 0) > 0 && (
          <div className="mt-2 space-y-1">
            {node.files?.map((f) => (
              <div key={f.id} className="flex items-center gap-1 text-xs">
                <FileTextOutlined className="text-gray-400" />
                <a
                  href={`/api/files/${f.id}`}
                  className="text-blue-500 hover:text-blue-700 truncate max-w-[160px]"
                  title={f.fileName}
                >
                  {f.fileName}
                </a>
                <span className="text-gray-400 shrink-0">
                  {formatFileSize(f.fileSize)}
                </span>
                <DeleteOutlined
                  className="text-gray-300 hover:text-red-500 cursor-pointer shrink-0"
                  onClick={async () => {
                    const res = await fetch(`/api/files/${f.id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      updateNodePartial(node.id, {
                        files: (node.files || []).filter(
                          (x) => x.id !== f.id
                        ),
                      });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}

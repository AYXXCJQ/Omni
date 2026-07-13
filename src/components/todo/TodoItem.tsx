"use client";

import { Checkbox, Input } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { TodoData } from "@/types";

/**
 * 单条待办项
 *
 * 复选框切换完成状态，内联编辑内容，hover 时显示删除按钮。
 */
export default function TodoItem({
  todo,
  onToggle,
  onChange,
  onDelete,
}: {
  todo: TodoData;
  onToggle: () => void;
  onChange: (content: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <Checkbox checked={todo.completed} onChange={onToggle} />
      <Input
        size="small"
        variant="borderless"
        value={todo.content}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(todo.content)}
        className={`flex-1 text-xs ${todo.completed ? "line-through text-gray-400" : ""}`}
        placeholder="输入待办项..."
      />
      <DeleteOutlined
        className="text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 text-xs"
        onClick={onDelete}
      />
    </div>
  );
}

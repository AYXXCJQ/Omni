"use client";

import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import TodoItem from "./TodoItem";
import { useNodeStore } from "@/store/nodeStore";
import type { TodoData } from "@/types";

/**
 * 待办列表
 *
 * 管理待办项的增删改、完成状态切换。
 * 所有变更先更新本地状态，再同步到服务端。
 */
export default function TodoList({
  nodeId,
  todos,
}: {
  nodeId: string;
  todos: TodoData[];
}) {
  const updateNodePartial = useNodeStore((s) => s.updateNodePartial);

  const updateTodos = (newTodos: TodoData[]) => {
    updateNodePartial(nodeId, { todos: newTodos });
  };

  // 切换完成状态
  const handleToggle = async (todo: TodoData) => {
    const updated = { ...todo, completed: !todo.completed };
    updateTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
    } catch {}
  };

  // 编辑内容
  const handleChange = async (todo: TodoData, content: string) => {
    updateTodos(todos.map((t) => (t.id === todo.id ? { ...t, content } : t)));
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch {}
  };

  // 删除
  const handleDelete = async (todoId: string) => {
    updateTodos(todos.filter((t) => t.id !== todoId));
    try {
      await fetch(`/api/todos/${todoId}`, { method: "DELETE" });
    } catch {}
  };

  // 新增
  const handleAdd = async () => {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId,
        content: "",
        sortOrder: todos.length,
      }),
    });
    if (res.ok) {
      const newTodo = await res.json();
      updateTodos([...todos, newTodo]);
    }
  };

  return (
    <div className="px-3 py-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => handleToggle(todo)}
          onChange={(content) => handleChange(todo, content)}
          onDelete={() => handleDelete(todo.id)}
        />
      ))}
      <Button
        type="dashed"
        size="small"
        block
        icon={<PlusOutlined />}
        onClick={handleAdd}
        className="mt-1 text-xs"
      >
        添加待办
      </Button>
    </div>
  );
}

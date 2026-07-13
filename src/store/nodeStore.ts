import { create } from "zustand";
import type { NodeData } from "@/types";

/**
 * 节点状态管理
 *
 * 维护两套数据：
 * - nodes: 嵌套树结构，用于画布渲染
 * - nodeMap: 扁平 Map（id → NodeData），用于快速查找
 */
interface NodeState {
  nodes: NodeData[];
  nodeMap: Map<string, NodeData>;

  setNodes: (nodes: NodeData[]) => void;
  upsertNode: (node: NodeData) => void;        // 新增或覆盖节点
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, posX: number, posY: number) => void;
  updateNodePartial: (id: string, partial: Partial<NodeData>) => void;
}

export const useNodeStore = create<NodeState>((set) => ({
  nodes: [],
  nodeMap: new Map(),

  // 用新树替换整个状态
  setNodes: (nodes) =>
    set(() => {
      const map = new Map<string, NodeData>();
      function walk(list: NodeData[]) {
        for (const n of list) {
          map.set(n.id, n);
          if (n.children) walk(n.children);
        }
      }
      walk(nodes);
      return { nodes, nodeMap: map };
    }),

  // 新增或更新节点。如果 parentId 改变，会重新挂接到正确的父节点下
  upsertNode: (node) =>
    set((state) => {
      const map = new Map(state.nodeMap);
      map.set(node.id, node);

      const old = state.nodeMap.get(node.id);
      const parentChanged = old && old.parentId !== node.parentId;

      // parentId 改变，需要先从旧位置移除，再插入新位置
      if (parentChanged) {
        // 从树中移除该节点
        function remove(list: NodeData[]): NodeData[] {
          return list
            .filter((n) => n.id !== node.id)
            .map((n) => ({
              ...n,
              children: n.children ? remove(n.children) : n.children,
            }));
        }
        // 插入到目标父节点下
        function insert(list: NodeData[]): NodeData[] {
          if (node.parentId) {
            return list.map((n) => {
              if (n.id === node.parentId) {
                return {
                  ...n,
                  children: [...(n.children || []), node],
                };
              }
              return {
                ...n,
                children: n.children ? insert(n.children) : n.children,
              };
            });
          }
          // parentId 为 null → 插入为根节点
          if (list.some((n) => n.id === node.id)) return list;
          return [...list, node];
        }
        return { nodes: insert(remove(state.nodes)), nodeMap: map };
      }

      // 正常更新：在树中找到节点并替换
      function walk(list: NodeData[]): NodeData[] {
        const hasNode = list.some((n) => n.id === node.id);
        if (hasNode) {
          return list.map((n) =>
            n.id === node.id
              ? node
              : { ...n, children: n.children ? walk(n.children) : n.children }
          );
        }
        if (node.parentId) {
          return list.map((n) => {
            if (n.id === node.parentId) {
              return {
                ...n,
                children: [
                  ...(n.children || []).filter((c) => c.id !== node.id),
                  node,
                ],
              };
            }
            return { ...n, children: n.children ? walk(n.children) : n.children };
          });
        }
        return [...list, node];
      }

      return { nodes: walk(state.nodes), nodeMap: map };
    }),

  // 从树中递归删除节点及其子树
  removeNode: (id) =>
    set((state) => {
      const map = new Map(state.nodeMap);
      map.delete(id);

      function filter(list: NodeData[]): NodeData[] {
        return list
          .filter((n) => n.id !== id)
          .map((n) => ({
            ...n,
            children: n.children ? filter(n.children) : [],
          }));
      }

      return { nodes: filter(state.nodes), nodeMap: map };
    }),

  // 仅更新节点坐标（拖拽时高频调用，优化性能）
  updateNodePosition: (id, posX, posY) =>
    set((state) => {
      const map = new Map(state.nodeMap);
      const existing = map.get(id);
      if (existing) {
        const updated = { ...existing, posX, posY };
        map.set(id, updated);
      }

      function update(list: NodeData[]): NodeData[] {
        return list.map((n) => {
          if (n.id === id) return { ...n, posX, posY };
          return { ...n, children: n.children ? update(n.children) : [] };
        });
      }

      return { nodes: update(state.nodes), nodeMap: map };
    }),

  // 更新节点的任意字段
  updateNodePartial: (id, partial) =>
    set((state) => {
      const map = new Map(state.nodeMap);
      const existing = map.get(id);
      if (existing) {
        map.set(id, { ...existing, ...partial });
      }

      function update(list: NodeData[]): NodeData[] {
        return list.map((n) => {
          if (n.id === id) return { ...n, ...partial };
          return { ...n, children: n.children ? update(n.children) : [] };
        });
      }

      return { nodes: update(state.nodes), nodeMap: map };
    }),
}));

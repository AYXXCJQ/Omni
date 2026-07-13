import type { NodeData } from "@/types";

/**
 * 将扁平的节点数组构建为嵌套树结构
 * @param nodes - 带 parentId 的扁平节点列表
 * @returns 树形结构的根节点数组
 */
export function buildTree(nodes: NodeData[]): NodeData[] {
  const map = new Map<string, NodeData>();
  const roots: NodeData[] = [];

  // 先复制一份，给每个节点加上 children 数组
  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  // 根据 parentId 建立父子关系
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 将嵌套树展开为扁平数组（深度优先遍历）
 */
export function flattenTree(nodes: NodeData[]): NodeData[] {
  const result: NodeData[] = [];
  function walk(list: NodeData[]) {
    for (const node of list) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

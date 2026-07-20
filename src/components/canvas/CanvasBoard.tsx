"use client";

import { useEffect, useCallback, useState, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import CanvasViewport from "./CanvasViewport";
import ConnectionLines from "./ConnectionLines";
import BaseNode from "@/components/node/BaseNode";
import NodeDetailPanel from "@/components/node/NodeDetailPanel";
import ContextMenu from "@/components/common/ContextMenu";
import ImportExportBar from "@/components/common/ImportExportBar";
import { useNodeStore } from "@/store/nodeStore";
import { useCanvasStore } from "@/store/canvasStore";
import { buildTree, flattenTree } from "@/lib/tree-utils";
import { screenToCanvas } from "@/lib/canvas-utils";
import type { NodeData } from "@/types";

/**
 * 主画布组件
 *
 * 职责：
 * 1. 初始化节点树（扁平 → 嵌套）
 * 2. 管理右键上下文菜单
 * 3. 管理节点详情抽屉
 * 4. 处理节点的增删改、移动、折叠操作
 */
export default function CanvasBoard({ nodes: initialNodes }: { nodes: NodeData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setNodes = useNodeStore((s) => s.setNodes);
  const nodes = useNodeStore((s) => s.nodes);
  const updateNodePartial = useNodeStore((s) => s.updateNodePartial);
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const movingNodeId = useCanvasStore((s) => s.movingNodeId);
  const setMovingNodeId = useCanvasStore((s) => s.setMovingNodeId);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);

  // 初始化：构建树 + 自动居中
  useEffect(() => {
    const tree = buildTree(initialNodes);
    setNodes(tree);

    if (containerRef.current) {
      const all = flattenTree(tree);
      if (all.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of all) {
          if (n.posX < minX) minX = n.posX;
          if (n.posY < minY) minY = n.posY;
          if (n.posX > maxX) maxX = n.posX;
          if (n.posY > maxY) maxY = n.posY;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        // 将节点包围盒中心对齐到画布容器中心
        setViewport({
          offsetX: rect.width / 2 - cx,
          offsetY: rect.height / 2 - cy,
        });
      }
    }
  }, [initialNodes, setNodes, setViewport]);

  // 添加子节点（颜色继承自父节点）
  const addNode = useCallback(async (parentId: string | null, canvasX: number, canvasY: number) => {
    let parentColor = "#1890ff";
    if (parentId) {
      const parent = useNodeStore.getState().nodeMap.get(parentId);
      if (parent) parentColor = parent.color;
    }
    const res = await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
        title: "新节点",
        color: parentColor,
        posX: canvasX,
        posY: canvasY,
      }),
    });
    if (res.ok) {
      const node = await res.json();
      useNodeStore.getState().upsertNode(node);
    }
  }, []);

  // 将源节点移动到目标节点下（parentId 变更）
  const handleMoveTo = useCallback(async (sourceId: string, targetId: string | null) => {
    const node = useNodeStore.getState().nodeMap.get(sourceId);
    if (!node) return;
    const updated = { ...node, parentId: targetId };
    useNodeStore.getState().upsertNode(updated);
    await fetch(`/api/nodes/${sourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: targetId }),
    }).catch(() => {});
    setMovingNodeId(null);
  }, [setMovingNodeId]);

  // 画布空白区域右键菜单
  const handleCanvasContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (movingNodeId) {
      // 移动模式下右键 → 取消移动（移回根）
      handleMoveTo(movingNodeId, null);
      return;
    }
    const pos = screenToCanvas(e.clientX, e.clientY, viewport);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, [viewport, movingNodeId, handleMoveTo]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setDetailNodeId(nodeId);
  }, []);

  const handleNodeContext = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  // 递归删除节点及其所有子节点
  const handleDelete = useCallback(async (nodeId: string) => {
    const node = useNodeStore.getState().nodeMap.get(nodeId);
    if (!node) return;
    const allIds = [nodeId, ...flattenTree(node.children || []).map((c) => c.id)];
    allIds.forEach((id) => useNodeStore.getState().removeNode(id));
    await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
    setCtxMenu(null);
    setDetailNodeId((prev) => (prev === nodeId ? null : prev));
  }, []);

  // 移动模式下的节点点击 → 确认目标
  const handleNodeClick = useCallback((nodeId: string) => {
    if (!movingNodeId || movingNodeId === nodeId) return;
    const source = useNodeStore.getState().nodeMap.get(movingNodeId);
    if (source && flattenTree(source.children || []).some((c) => c.id === nodeId)) return;
    handleMoveTo(movingNodeId, nodeId);
  }, [movingNodeId, handleMoveTo]);

  // 折叠/展开子节点
  const handleToggleCollapse = useCallback(async (nodeId: string, current: boolean) => {
    const next = !current;
    updateNodePartial(nodeId, { collapsed: next });
    await fetch(`/api/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collapsed: next }),
    }).catch(() => {});
  }, [updateNodePartial]);

  // 移动模式下 ESC 取消
  useEffect(() => {
    if (!movingNodeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMovingNodeId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [movingNodeId, setMovingNodeId]);

  // 导入完成后刷新画布
  const handleImported = useCallback((newNodes: NodeData[]) => {
    const tree = buildTree(newNodes);
    setNodes(tree);
  }, [setNodes]);

  const detailNode = detailNodeId ? useNodeStore.getState().nodeMap.get(detailNodeId) ?? null : null;

  return (
    <div ref={containerRef} className="relative w-full h-screen" onContextMenu={handleCanvasContext}>
      {/* 移动模式顶部提示 */}
      {movingNodeId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-1.5 rounded text-sm shadow-lg whitespace-nowrap">
          请点击目标节点 (ESC 取消)
        </div>
      )}
      {!detailNodeId && <ImportExportBar onImported={handleImported} />}
      <CanvasViewport>
        <ConnectionLines />
        {/* 递归渲染节点树，跳过折叠节点的子节点 */}
        {nodes.map(function renderNode(node) {
          return (
            <Fragment key={node.id}>
              <BaseNode
                node={node}
                movingNodeId={movingNodeId}
                onSelect={() => {
                  if (movingNodeId) {
                    handleNodeClick(node.id);
                  } else {
                    handleNodeSelect(node.id);
                  }
                }}
                onAddChild={(canvasX, canvasY) => addNode(node.id, canvasX, canvasY)}
                onContext={(e) => handleNodeContext(e, node.id)}
                onToggleCollapse={() => handleToggleCollapse(node.id, node.collapsed)}
              />
              {!node.collapsed && node.children?.map(renderNode)}
            </Fragment>
          );
        })}
      </CanvasViewport>

      {/* 右键菜单 */}
      {ctxMenu && (
        <ContextMenu
          position={{ x: ctxMenu.x, y: ctxMenu.y }}
          items={[
            ...(ctxMenu.nodeId
              ? [
                  {
                    key: "add-child",
                    label: "添加子节点",
                    onClick: async () => {
                      const parent = useNodeStore.getState().nodeMap.get(ctxMenu.nodeId!);
                      if (parent) {
                        await addNode(ctxMenu.nodeId!, parent.posX + 160, parent.posY);
                      }
                      setCtxMenu(null);
                    },
                  },
                  {
                    key: "move",
                    label: "移动至...",
                    onClick: () => {
                      setMovingNodeId(ctxMenu.nodeId!);
                      setCtxMenu(null);
                    },
                  },
                  {
                    key: "edit",
                    label: "编辑",
                    onClick: () => {
                      setDetailNodeId(ctxMenu.nodeId!);
                      setCtxMenu(null);
                    },
                  },
                  {
                    key: "delete",
                    label: "删除",
                    danger: true,
                    onClick: () => handleDelete(ctxMenu.nodeId!),
                  },
                ]
              : [
                  {
                    key: "add-root",
                    label: "添加根节点",
                    onClick: async () => {
                      const pos = screenToCanvas(ctxMenu.x, ctxMenu.y, viewport);
                      await addNode(null, pos.x, pos.y);
                      setCtxMenu(null);
                    },
                  },
                ]),
          ]}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* 节点详情抽屉 */}
      <NodeDetailPanel
        node={detailNode}
        open={!!detailNode}
        onClose={() => setDetailNodeId(null)}
        onDelete={() => detailNode && handleDelete(detailNode.id)}
      />
    </div>
  );
}

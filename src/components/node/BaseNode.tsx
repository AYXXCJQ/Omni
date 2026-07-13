"use client";

import { memo, useCallback, useMemo } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useNodeStore } from "@/store/nodeStore";
import { useNodeDrag } from "@/hooks/useNodeDrag";
import { useDoubleClick } from "@/hooks/useDoubleClick";
import { NODE_RADIUS } from "@/lib/canvas-utils";
import type { NodeData } from "@/types";

// 将颜色字符串转为 rgba，支持 #RRGGBB 和 rgb() 两种格式
function toRgba(color: string, opacity: number) {
  const m = color.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (m) {
    return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${opacity})`;
  }
  const rm = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rm) {
    return `rgba(${rm[1]},${rm[2]},${rm[3]},${opacity})`;
  }
  return "transparent";
}

// 选中时显示的四方向添加子节点按钮位置
const HANDLE_POSITIONS = [
  { dx: 0, dy: -1, label: "上" },
  { dx: 1, dy: 0, label: "右" },
  { dx: 0, dy: 1, label: "下" },
  { dx: -1, dy: 0, label: "左" },
];

function BaseNodeInner({
  node,
  movingNodeId,
  onSelect,
  onAddChild,
  onContext,
  onToggleCollapse,
}: {
  node: NodeData;
  movingNodeId?: string | null;
  onSelect: () => void;
  onAddChild: (canvasX: number, canvasY: number) => void;
  onContext: (e: React.MouseEvent) => void;
  onToggleCollapse: () => void;
}) {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const isDragging = useCanvasStore((s) => s.isDragging);
  const drag = useNodeDrag(node.id);
  const isSelected = selectedNodeId === node.id;
  const isMoveSource = movingNodeId === node.id;

  // 判断目标节点是否是移动操作的非法目标（即源节点的后代）
  const isInvalidTarget = useMemo(() => {
    if (!movingNodeId || movingNodeId === node.id) return false;
    let pid = node.parentId;
    while (pid) {
      if (pid === movingNodeId) return true;
      const parent = useNodeStore.getState().nodeMap.get(pid);
      pid = (parent as NodeData | undefined)?.parentId ?? null;
    }
    return false;
  }, [movingNodeId, node.id, node.parentId]);
  const isMoveTarget = !!movingNodeId && movingNodeId !== node.id && !isInvalidTarget;

  // 单击：选中节点 / 完成移动操作
  const handleClick = useCallback(
    () => {
      if (isDragging) return;
      if (drag.draggedRef.current) {
        drag.draggedRef.current = false;
        return;
      }
      if (isInvalidTarget) return;
      if (!movingNodeId) setSelectedNodeId(node.id);
      onSelect();
    },
    [node.id, isDragging, movingNodeId, isInvalidTarget, setSelectedNodeId, onSelect]
  );

  // 双击：有子节点则折叠/展开，叶子节点则添加子节点
  const handleDoubleClick = useCallback(
    () => {
      if (node.children && node.children.length > 0) {
        onToggleCollapse();
      } else {
        onAddChild(node.posX + 80, node.posY + 80);
      }
    },
    [node, onToggleCollapse, onAddChild]
  );

  const onClick = useDoubleClick(handleClick, handleDoubleClick);
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onContext(e);
  }, [onContext]);

  return (
    <div
      data-node={node.id}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onContextMenu={onContext}
      onMouseDown={drag.onMouseDown}
      style={{
        position: "absolute",
        left: node.posX - NODE_RADIUS,
        top: node.posY - NODE_RADIUS,
        width: NODE_RADIUS * 2,
        height: NODE_RADIUS * 2,
        borderRadius: "50%",
        background: toRgba(node.color, 0.15),
        border: `3px solid ${isInvalidTarget ? "#ff4d4f" : isMoveTarget ? "#1677ff" : node.color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isInvalidTarget ? "not-allowed" : isMoveTarget ? "copy" : "pointer",
        userSelect: "none",
        opacity: isMoveSource ? 0.4 : 1,
        boxShadow: isSelected
          ? `0 0 0 4px ${toRgba(node.color, 0.25)}, 0 4px 20px rgba(0,0,0,0.15)`
          : isMoveTarget
            ? `0 0 0 4px #1677ff40, 0 4px 20px rgba(0,0,0,0.15)`
            : isInvalidTarget
              ? `0 0 0 4px #ff4d4f40, 0 4px 20px rgba(0,0,0,0.15)`
              : "0 2px 8px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s, transform 0.1s",
        zIndex: isSelected ? 10 : isMoveTarget || isInvalidTarget ? 9 : 1,
        }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
    >
      {/* 节点标题 */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: node.color,
          textAlign: "center",
          padding: 8,
          lineHeight: 1.3,
          wordBreak: "break-word",
          maxWidth: NODE_RADIUS * 1.6,
        }}
      >
        {node.title || "新节点"}
      </span>

      {/* todo 节点标识 */}
      {node.type === "todo" && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: node.color,
            color: "#fff",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ✓
        </div>
      )}

      {/* 折叠状态下的子节点数量角标 */}
      {node.children && node.children.length > 0 && node.collapsed && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: node.color,
            color: "#fff",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {node.children!.length}
        </div>
      )}

      {/* 选中时显示的四方向添加按钮 */}
      {isSelected && HANDLE_POSITIONS.map((pos, i) => (
        <div
          key={i}
          data-add-btn
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(
              node.posX + pos.dx * (NODE_RADIUS + 50),
              node.posY + pos.dy * (NODE_RADIUS + 50)
            );
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: node.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: "bold",
            cursor: "pointer",
            transform: `translate(${pos.dx * NODE_RADIUS - 11}px, ${pos.dy * NODE_RADIUS - 11}px)`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
            (e.currentTarget.parentElement as HTMLElement).style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0";
          }}
        >
          +
        </div>
      ))}
    </div>
  );
}

export default memo(BaseNodeInner);

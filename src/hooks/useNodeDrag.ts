import { useCallback, useRef } from "react";
import { useNodeStore } from "@/store/nodeStore";
import { useCanvasStore } from "@/store/canvasStore";

/**
 * 节点拖拽 Hook
 *
 * 在 mousedown 时注册 window 级 mousemove/mouseup 监听，
 * 拖拽过程中实时更新节点位置（仅本地状态），
 * mouseup 时将最终位置持久化到服务端。
 */
export function useNodeDrag(nodeId: string) {
  const updateNodePosition = useNodeStore((s) => s.updateNodePosition);
  const viewport = useCanvasStore((s) => s.viewport);
  const setIsDragging = useCanvasStore((s) => s.setIsDragging);
  // 标记是否发生过拖拽，用于区分"点击"和"拖拽后释放"
  const draggedRef = useRef(false);

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0,
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      draggedRef.current = false;
      dragRef.current = {
        isDragging: false,
        startX: e.clientX,
        startY: e.clientY,
        nodeStartX: 0,
        nodeStartY: 0,
      };

      const node = useNodeStore.getState().nodeMap.get(nodeId);
      if (node) {
        dragRef.current.nodeStartX = node.posX;
        dragRef.current.nodeStartY = node.posY;
      }

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;

        // 超过 5px 才认定为拖拽，防止误触
        if (!dragRef.current.isDragging) {
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragRef.current.isDragging = true;
            draggedRef.current = true;
            setIsDragging(true);
          } else {
            return;
          }
        }

        updateNodePosition(
          nodeId,
          dragRef.current.nodeStartX + dx / viewport.scale,
          dragRef.current.nodeStartY + dy / viewport.scale
        );
      };

      const handleMouseUp = (ev: MouseEvent) => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (dragRef.current.isDragging) {
          setIsDragging(false);
          // 计算最终坐标并持久化
          const finalPosX =
            dragRef.current.nodeStartX +
            (ev.clientX - dragRef.current.startX) / viewport.scale;
          const finalPosY =
            dragRef.current.nodeStartY +
            (ev.clientY - dragRef.current.startY) / viewport.scale;
          fetch(`/api/nodes/${nodeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              posX: Math.round(finalPosX),
              posY: Math.round(finalPosY),
            }),
          }).catch(() => {});
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [nodeId, updateNodePosition, viewport.scale, setIsDragging]
  );

  return { onMouseDown: handleMouseDown, draggedRef };
}

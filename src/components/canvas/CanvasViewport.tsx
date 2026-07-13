"use client";

import { useCallback, useRef, useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { screenToCanvas } from "@/lib/canvas-utils";
import styles from "@/styles/canvas.module.css";

/**
 * 画布视口容器
 *
 * 处理：
 * - 鼠标拖拽平移（空白区域）
 * - 滚轮缩放（以鼠标位置为缩放中心）
 */
export default function CanvasViewport({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // 拖拽平移开始（排除节点点击）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-node]") || (e.target as HTMLElement).closest("[data-add-btn]")) return;
      if (e.button !== 0) return;
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setViewport({
        offsetX: viewport.offsetX + dx,
        offsetY: viewport.offsetY + dy,
      });
    },
    [viewport.offsetX, viewport.offsetY, setViewport]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // 滚轮缩放（以鼠标位置为中心）
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(5, Math.max(0.1, viewport.scale * delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setViewport({
        scale: newScale,
        offsetX: mx - (mx - viewport.offsetX) * (newScale / viewport.scale),
        offsetY: my - (my - viewport.offsetY) * (newScale / viewport.scale),
      });
    },
    [viewport.scale, viewport.offsetX, viewport.offsetY, setViewport]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={styles.viewport}
        style={{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

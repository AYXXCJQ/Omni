"use client";

import { useMemo } from "react";
import { useNodeStore } from "@/store/nodeStore";
import { NODE_RADIUS } from "@/lib/canvas-utils";
import styles from "@/styles/canvas.module.css";

/**
 * 计算两个圆形节点之间的连边端点
 * 从源圆边缘到目标圆边缘，避免线条穿过圆内部
 */
function getEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x1, y1, x2, y2 };
  const nx = dx / dist;
  const ny = dy / dist;
  return {
    x1: x1 + nx * r,
    y1: y1 + ny * r,
    x2: x2 - nx * r,
    y2: y2 - ny * r,
  };
}

/**
 * 节点连接线层
 *
 * 使用 SVG 贝塞尔曲线绘制所有父子节点的连接关系。
 * 折叠节点的子节点会被跳过（不显示连接线）。
 */
export default function ConnectionLines() {
  const nodes = useNodeStore((s) => s.nodes);

  const paths = useMemo(() => {
    const result: string[] = [];

    function walk(list: typeof nodes) {
      for (const node of list) {
        if (node.collapsed) continue;
        if (node.children) {
          for (const child of node.children) {
            // 计算端点（在圆边缘上）
            const { x1, y1, x2, y2 } = getEdge(
              node.posX,
              node.posY,
              child.posX,
              child.posY,
              NODE_RADIUS
            );
            // 贝塞尔控制点沿连线方向偏移 40% 距离
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / dist;
            const ny = dy / dist;
            const cpDist = dist * 0.4;
            const cp1x = x1 + nx * cpDist;
            const cp1y = y1 + ny * cpDist;
            const cp2x = x2 - nx * cpDist;
            const cp2y = y2 - ny * cpDist;
            result.push(
              `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
            );
            walk([child]);
          }
        }
      }
    }

    walk(nodes);
    return result;
  }, [nodes]);

  if (paths.length === 0) return null;

  return (
    <svg className={styles.connectionLayer} overflow="visible">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#d9d9d9" strokeWidth={2.5} strokeLinecap="round" />
      ))}
    </svg>
  );
}

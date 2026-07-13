import type { CanvasViewport, NodeData } from "@/types";

// 节点圆形的半径（px），决定了节点在画布上的视觉大小
const NODE_RADIUS = 60;

/**
 * 获取节点的包围盒
 */
export function getNodeBoundingBox(node: NodeData) {
  return {
    left: node.posX - NODE_RADIUS,
    top: node.posY - NODE_RADIUS,
    right: node.posX + NODE_RADIUS,
    bottom: node.posY + NODE_RADIUS,
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
  };
}

/**
 * 根据视口状态筛选当前可见的节点，用于性能优化
 * @param margin - 裁剪边距（像素），避免视口边缘闪动
 */
export function getVisibleNodes(
  nodes: NodeData[],
  viewport: CanvasViewport,
  containerWidth: number,
  containerHeight: number,
  margin = 200
): NodeData[] {
  // 将视口位移/缩放转换为画布坐标空间的可见矩形
  const left = -viewport.offsetX / viewport.scale - margin;
  const top = -viewport.offsetY / viewport.scale - margin;
  const right = left + containerWidth / viewport.scale + margin * 2;
  const bottom = top + containerHeight / viewport.scale + margin * 2;

  return nodes.filter((node) => {
    const box = getNodeBoundingBox(node);
    return (
      box.left < right && box.right > left &&
      box.top < bottom && box.bottom > top
    );
  });
}

/**
 * 将屏幕坐标转换为画布坐标（考虑视口位移和缩放）
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: CanvasViewport
): { x: number; y: number } {
  return {
    x: (screenX - viewport.offsetX) / viewport.scale,
    y: (screenY - viewport.offsetY) / viewport.scale,
  };
}

export { NODE_RADIUS };

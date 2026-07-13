"use client";

import { useMemo } from "react";
import { useNodeStore } from "@/store/nodeStore";
import { useCanvasStore } from "@/store/canvasStore";
import { getVisibleNodes } from "@/lib/canvas-utils";

export default function VirtualNodeRenderer({
  renderNode,
}: {
  renderNode: (node: import("@/types").NodeData) => React.ReactNode;
}) {
  const nodes = useNodeStore((s) => s.nodes);
  const viewport = useCanvasStore((s) => s.viewport);

  const visibleNodes = useMemo(() => {
    return getVisibleNodes(nodes, viewport, 1920, 1080);
  }, [nodes, viewport]);

  return <>{visibleNodes.map(renderNode)}</>;
}

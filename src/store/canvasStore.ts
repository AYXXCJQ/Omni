import { create } from "zustand";
import type { CanvasViewport } from "@/types";

/**
 * 画布交互状态管理
 *
 * 跟踪视口变换、选中节点、拖拽状态、移动操作等
 */
interface CanvasState {
  viewport: CanvasViewport;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  isDragging: boolean;       // 是否正在拖拽节点
  movingNodeId: string | null; // 正在执行"移动至"操作的源节点

  setViewport: (partial: Partial<CanvasViewport>) => void;
  setSelectedNodeId: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  setIsDragging: (v: boolean) => void;
  setMovingNodeId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  viewport: { offsetX: 0, offsetY: 0, scale: 1 },
  selectedNodeId: null,
  editingNodeId: null,
  isDragging: false,
  movingNodeId: null,

  setViewport: (partial) =>
    set((state) => ({
      viewport: { ...state.viewport, ...partial },
    })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  setIsDragging: (v) => set({ isDragging: v }),
  setMovingNodeId: (id) => set({ movingNodeId: id }),
}));

import { useCanvasStore } from "@/store/canvasStore";

/**
 * 编辑器懒加载控制
 *
 * 同一时间只允许一个节点处于编辑状态，
 * 避免多个编辑器实例同时加载造成的性能问题。
 */
export function useLazyEditor(nodeId: string) {
  const editingNodeId = useCanvasStore((s) => s.editingNodeId);
  const setEditingNodeId = useCanvasStore((s) => s.setEditingNodeId);

  const isEditing = editingNodeId === nodeId;

  const startEditing = () => setEditingNodeId(nodeId);
  const stopEditing = () => setEditingNodeId(null);

  return { isEditing, startEditing, stopEditing };
}

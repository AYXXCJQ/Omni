// 节点类型：general 普通节点 / todo 待办节点
export type NodeType = "general" | "todo";

// 节点数据结构，与 Prisma schema 对应
export interface NodeData {
  id: string;
  userId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  content: string;       // 富文本内容（HTML）
  color: string;         // 节点颜色（#RRGGBB）
  posX: number;          // 画布 X 坐标
  posY: number;          // 画布 Y 坐标
  collapsed: boolean;    // 是否折叠子节点
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: NodeData[];     // 子节点（树构建后填充）
  todos?: TodoData[];        // 关联的待办项
  files?: AttachmentData[];  // 关联的文件附件
}

// 待办事项
export interface TodoData {
  id: string;
  nodeId: string;
  content: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 文件附件
export interface AttachmentData {
  id: string;
  nodeId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  createdAt: string;
}

// 画布视口状态（位移和缩放）
export interface CanvasViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

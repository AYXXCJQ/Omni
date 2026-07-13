import { prisma } from "@/lib/prisma";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import type { NodeData } from "@/types";

const USER_ID = "default-user";

/**
 * 首页
 *
 * 服务端组件：从数据库加载节点列表，序列化后传给 CanvasBoard 客户端组件。
 * 如果没有任何节点，自动创建一个根节点"中心节点"。
 */
export default async function Home() {
  let nodes = await prisma.node.findMany({
    where: { userId: USER_ID },
    include: {
      todos: { orderBy: { sortOrder: "asc" } },
      files: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  if (nodes.length === 0) {
    const root = await prisma.node.create({
      data: {
        userId: USER_ID,
        title: "中心节点",
        posX: 400,
        posY: 300,
        color: "#1890ff",
      },
      include: { todos: true, files: true },
    });
    nodes = [root];
  }

  // 序列化：Next.js 服务端组件要求数据可序列化
  const data: NodeData[] = JSON.parse(JSON.stringify(nodes));

  return <CanvasBoard nodes={data} />;
}

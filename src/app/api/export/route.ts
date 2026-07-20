import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "default-user";

interface ExportNode {
  title: string;
  type: string;
  content: string;
  color: string;
  posX: number;
  posY: number;
  collapsed: boolean;
  sortOrder: number;
  todos: { content: string; completed: boolean; sortOrder: number }[];
  children: ExportNode[];
}

function buildTree(
  nodes: {
    parentId: string | null;
    sortOrder: number;
    title: string;
    type: string;
    content: string;
    color: string;
    posX: number;
    posY: number;
    collapsed: boolean;
    todos: { content: string; completed: boolean; sortOrder: number }[];
  }[],
  parentId: string | null = null
): ExportNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((n) => ({
      title: n.title,
      type: n.type,
      content: n.content,
      color: n.color,
      posX: n.posX,
      posY: n.posY,
      collapsed: n.collapsed,
      sortOrder: n.sortOrder,
      todos: n.todos,
      children: buildTree(nodes, (n as any).id),
    }));
}

export async function GET() {
  const nodes = await prisma.node.findMany({
    where: { userId: USER_ID },
    include: { todos: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const tree = buildTree(nodes);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    nodes: tree,
  };

  return NextResponse.json(exportData);
}

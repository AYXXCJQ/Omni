import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "default-user";

interface ImportNode {
  title?: string;
  type?: string;
  content?: string;
  color?: string;
  posX?: number;
  posY?: number;
  collapsed?: boolean;
  sortOrder?: number;
  todos?: { content: string; completed: boolean; sortOrder: number }[];
  children?: ImportNode[];
}

interface FlatNode {
  id: string;
  parentId: string | null;
  title: string;
  type: string;
  content: string;
  color: string;
  posX: number;
  posY: number;
  collapsed: boolean;
  sortOrder: number;
  todos: { content: string; completed: boolean; sortOrder: number }[];
}

function flattenTree(nodes: ImportNode[], parentId: string | null = null): FlatNode[] {
  const result: FlatNode[] = [];
  nodes.forEach((n, i) => {
    const id = crypto.randomUUID();
    result.push({
      id,
      parentId,
      title: n.title ?? "",
      type: n.type ?? "general",
      content: n.content ?? "",
      color: n.color ?? "#1890ff",
      posX: n.posX ?? 400,
      posY: n.posY ?? 300,
      collapsed: n.collapsed ?? false,
      sortOrder: n.sortOrder ?? i,
      todos: n.todos ?? [],
    });
    if (n.children?.length) {
      result.push(...flattenTree(n.children, id));
    }
  });
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.nodes)) {
      return NextResponse.json({ error: "无效的导入格式：缺少 nodes 数组" }, { status: 400 });
    }

    const flattened = flattenTree(body.nodes);

    if (flattened.length === 0) {
      return NextResponse.json({ error: "没有可导入的节点" }, { status: 400 });
    }

    await prisma.$transaction(
      flattened.map((node) =>
        prisma.node.create({
          data: {
            id: node.id,
            userId: USER_ID,
            parentId: node.parentId,
            type: node.type,
            title: node.title,
            content: node.content,
            color: node.color,
            posX: node.posX,
            posY: node.posY,
            collapsed: node.collapsed,
            sortOrder: node.sortOrder,
            todos: {
              create: node.todos.map((t) => ({
                content: t.content,
                completed: t.completed,
                sortOrder: t.sortOrder,
              })),
            },
          },
        })
      )
    );

    const created = await prisma.node.findMany({
      where: { userId: USER_ID },
      include: {
        todos: { orderBy: { sortOrder: "asc" } },
        files: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ nodes: created, count: flattened.length });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: "导入失败：" + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}

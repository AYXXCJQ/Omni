import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "default-user";

// 获取用户的所有节点（包含待办和附件）
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || USER_ID;

  const nodes = await prisma.node.findMany({
    where: { userId },
    include: {
      todos: { orderBy: { sortOrder: "asc" } },
      files: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  return Response.json(nodes);
}

// 创建新节点
export async function POST(req: NextRequest) {
  const body = await req.json();

  const node = await prisma.node.create({
    data: {
      userId: body.userId || USER_ID,
      parentId: body.parentId || null,
      type: body.type || "general",
      title: body.title || "新节点",
      content: body.content || "",
      color: body.color || "#1890ff",
      posX: body.posX ?? 400,
      posY: body.posY ?? 300,
      sortOrder: body.sortOrder ?? 0,
    },
    include: { todos: true, files: true },
  });

  return Response.json(node, { status: 201 });
}

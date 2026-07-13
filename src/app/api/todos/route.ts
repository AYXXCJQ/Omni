import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 创建待办项
export async function POST(req: NextRequest) {
  const body = await req.json();
  const todo = await prisma.todo.create({
    data: {
      nodeId: body.nodeId,
      content: body.content || "",
      completed: body.completed ?? false,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return Response.json(todo, { status: 201 });
}

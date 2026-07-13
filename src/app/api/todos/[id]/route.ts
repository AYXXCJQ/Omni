import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 更新待办项（内容/完成状态/排序）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(body.content !== undefined && { content: body.content }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });
  return Response.json(todo);
}

// 删除待办项
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.todo.delete({ where: { id } });
  return new Response(null, { status: 204 });
}

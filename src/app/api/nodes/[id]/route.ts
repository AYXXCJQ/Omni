import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 更新节点的任意字段（title/color/posX/posY/collapsed/type/parentId 等）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const node = await prisma.node.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.posX !== undefined && { posX: body.posX }),
      ...(body.posY !== undefined && { posY: body.posY }),
      ...(body.collapsed !== undefined && { collapsed: body.collapsed }),
      ...(body.parentId !== undefined && { parentId: body.parentId }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
    include: { todos: true, files: true },
  });

  return Response.json(node);
}

// 删除节点
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.node.delete({ where: { id } });
  return new Response(null, { status: 204 });
}

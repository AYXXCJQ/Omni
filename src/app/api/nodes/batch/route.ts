import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 批量更新节点位置（用于拖拽后一次性持久化多个节点的坐标）
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { nodes } = body as { nodes: { id: string; posX: number; posY: number }[] };

  await prisma.$transaction(
    nodes.map((n) =>
      prisma.node.update({
        where: { id: n.id },
        data: { posX: n.posX, posY: n.posY },
      })
    )
  );

  return Response.json({ ok: true });
}

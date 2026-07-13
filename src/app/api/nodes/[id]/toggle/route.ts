import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 切换节点的折叠状态（/api/nodes/:id/toggle — POST）
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const node = await prisma.node.findUnique({ where: { id } });
  if (!node) return Response.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.node.update({
    where: { id },
    data: { collapsed: !node.collapsed },
  });
  return Response.json(updated);
}

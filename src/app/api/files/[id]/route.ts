import { NextRequest } from "next/server";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

// 下载文件
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const filePath = join(process.cwd(), "public", attachment.filePath);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Download failed" },
      { status: 500 }
    );
  }
}

// 删除文件（同时删除磁盘文件和 DB 记录）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const filePath = join(process.cwd(), "public", attachment.filePath);
    await unlink(filePath).catch(() => {});
    await prisma.attachment.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Delete error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

// 文件上传：接收 multipart/form-data，保存到 public/uploads/ 并创建 DB 记录
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const nodeId = formData.get("nodeId") as string | null;

    if (!file || !nodeId) {
      return Response.json(
        { error: "file and nodeId required" },
        { status: 400 }
      );
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        nodeId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: `/uploads/${fileName}`,
      },
    });

    return Response.json(attachment, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

"use client";

import dynamic from "next/dynamic";

/**
 * 编辑器懒加载容器
 *
 * Tiptap 体积较大（~100KB），通过 Next.js dynamic import 按需加载，
 * 仅在通用节点详情打开时才下载编辑器代码。
 */
const TipTapEditor = dynamic(
  () => import("@/components/node/TipTapEditor"),
  { ssr: false, loading: () => <div className="text-gray-400 text-xs p-2">点击编辑...</div> }
);

export default function LazyEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  return <TipTapEditor content={content} onChange={onChange} />;
}

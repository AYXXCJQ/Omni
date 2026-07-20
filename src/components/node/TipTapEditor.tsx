"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { TableKit } from "@tiptap/extension-table";
import { useEffect, useCallback } from "react";
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  BlockOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  TableOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

function Tb({ active, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
        background: active ? "#e6f4ff" : "transparent",
        color: active ? "#1677ff" : "#595959",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: "#e8e8e8", margin: "0 4px", flexShrink: 0 }} />;
}

const tableBtnStyle: React.CSSProperties = {
  width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600,
  background: "transparent", color: "#595959",
  fontFamily: "monospace",
};

export default function TipTapEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: "输入内容..." }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      TableKit.configure({ table: { resizable: true } }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "p-3 text-sm",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                uploadImage(file, editor);
                return true;
              }
            }
          }
        }
        const text = event.clipboardData?.getData("text/plain");
        const html = event.clipboardData?.getData("text/html");
        if (text && !html) {
          const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          editor?.chain().focus().insertContent(`<p>${escaped.replace(/\n/g, "<br>")}</p>`).run();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!content) return;
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("输入链接地址:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("输入图片地址:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const uploadImage = async (file: File, ed: typeof editor) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nodeId", "");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        ed?.chain().focus().setImage({ src: data.filePath }).run();
      }
    } catch {}
  };

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const inTable = editor.isActive("table");

  return (
    <div className="border border-gray-200 rounded-md flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-0.5 p-1 border-b border-gray-200 bg-white flex-wrap shrink-0">
        <Tb onClick={() => editor.chain().focus().undo().run()} title="撤销"><UndoOutlined /></Tb>
        <Tb onClick={() => editor.chain().focus().redo().run()} title="重做"><RedoOutlined /></Tb>

        <Sep />

        <Tb active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗"><BoldOutlined /></Tb>
        <Tb active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体"><ItalicOutlined /></Tb>
        <Tb active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线"><StrikethroughOutlined /></Tb>
        <Tb active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="下划线">
          <span style={{ textDecoration: "underline", fontWeight: 700 }}>U</span>
        </Tb>

        <Sep />

        <Tb active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="标题1">
          <span style={{ fontWeight: 700, fontSize: 13 }}>H1</span>
        </Tb>
        <Tb active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="标题2">
          <span style={{ fontWeight: 700, fontSize: 12 }}>H2</span>
        </Tb>
        <Tb active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="标题3">
          <span style={{ fontWeight: 700, fontSize: 11 }}>H3</span>
        </Tb>

        <Sep />

        <Tb active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表"><UnorderedListOutlined /></Tb>
        <Tb active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表"><OrderedListOutlined /></Tb>
        <Tb active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用"><BlockOutlined /></Tb>
        <Tb active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="代码块"><CodeOutlined /></Tb>

        <Sep />

        <Tb active={editor.isActive("link")} onClick={addLink} title="链接"><LinkOutlined /></Tb>
        <Tb onClick={addImage} title="图片"><PictureOutlined /></Tb>

        <Sep />

        <Tb active={inTable} onClick={insertTable} title="插入表格"><TableOutlined /></Tb>

        {inTable && (
          <>
            <Sep />
            <button onClick={() => editor.chain().focus().addColumnBefore().run()} title="左侧插入列" style={tableBtnStyle}>|◀</button>
            <button onClick={() => editor.chain().focus().addColumnAfter().run()} title="右侧插入列" style={tableBtnStyle}>▶|</button>
            <button onClick={() => editor.chain().focus().addRowBefore().run()} title="上方插入行" style={tableBtnStyle}>▲―</button>
            <button onClick={() => editor.chain().focus().addRowAfter().run()} title="下方插入行" style={tableBtnStyle}>▼―</button>
            <Sep />
            <button onClick={() => editor.chain().focus().deleteColumn().run()} title="删除列" style={tableBtnStyle}><DeleteOutlined /></button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} title="删除行" style={tableBtnStyle}>☰✕</button>
            <button onClick={() => editor.chain().focus().mergeCells().run()} title="合并单元格" style={tableBtnStyle}>⊕</button>
            <button onClick={() => editor.chain().focus().splitCell().run()} title="拆分单元格" style={tableBtnStyle}>⊘</button>
            <Sep />
            <button onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="切换表头行" style={{ ...tableBtnStyle, color: editor.isActive("table") || editor.isActive("tableHeader") ? "#1677ff" : undefined }}>H</button>
            <button onClick={() => editor.chain().focus().deleteTable().run()} title="删除表格" style={tableBtnStyle}>✕</button>
          </>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

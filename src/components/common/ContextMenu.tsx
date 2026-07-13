"use client";

import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

/**
 * 右键上下文菜单
 *
 * 点击菜单外部自动关闭
 */
export default function ContextMenu({
  items,
  position,
  onClose,
}: {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${
            item.danger ? "text-red-500 hover:bg-red-50" : "text-gray-700"
          }`}
          onClick={item.onClick}
        >
          {item.icon}
          {item.label}
        </div>
      ))}
    </div>
  );
}

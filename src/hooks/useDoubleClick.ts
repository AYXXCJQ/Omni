import { useCallback, useRef } from "react";

/**
 * 区分单击和双击的 Hook
 *
 * 单击时延迟 threshold 毫秒执行 onSingleClick，
 * 若在延迟期间再次点击则取消定时器并触发 onDoubleClick。
 */
export function useDoubleClick(
  onSingleClick: () => void,
  onDoubleClick: () => void,
  threshold = 250
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(
    () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        onDoubleClick();
      } else {
        timer.current = setTimeout(() => {
          timer.current = null;
          onSingleClick();
        }, threshold);
      }
    },
    [onSingleClick, onDoubleClick, threshold]
  );

  return handleClick;
}

import { useRef, useCallback } from "react";

/**
 * 防抖 Hook，延迟 delay 毫秒后执行函数
 * 连续调用时只有最后一次生效
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args: any[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    }) as T,
    [fn, delay]
  );
}

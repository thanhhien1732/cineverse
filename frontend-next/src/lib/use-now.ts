"use client";

import { useEffect, useState } from "react";

/**
 * Mốc thời gian hiện tại, tự cập nhật theo chu kỳ để màn hình đặt vé loại bỏ
 * các suất chiếu vừa trôi qua mà không cần tải lại trang.
 *
 * Trả về `null` ở lần render đầu (kể cả khi render trên server) để HTML tĩnh
 * khớp với lần hydrate đầu tiên; nơi dùng coi `null` là "chưa xác định".
 */
export function useNow(intervalMs = 30000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Lần đọc đầu hoãn sang macrotask để không setState đồng bộ trong effect.
    const initialTimer = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}

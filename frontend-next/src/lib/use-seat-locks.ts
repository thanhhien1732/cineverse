"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Nhịp hỏi lại server để thấy ghế người khác vừa giữ. */
const pollIntervalMs = 4000;

/** Nhịp gia hạn khoá ghế của chính mình khi người dùng ngồi yên trên trang. */
const heartbeatIntervalMs = 60000;

const clientIdStorageKey = "cineverse.seat-lock-client-id";

/**
 * Mỗi tab là một "người dùng" riêng: sessionStorage không chia sẻ giữa các tab
 * nên mở hai tab là mô phỏng được hai khách cùng chọn ghế.
 */
function readClientId(): string {
  try {
    const saved = window.sessionStorage.getItem(clientIdStorageKey);

    if (saved) {
      return saved;
    }

    const created = crypto.randomUUID();
    window.sessionStorage.setItem(clientIdStorageKey, created);

    return created;
  } catch {
    return crypto.randomUUID();
  }
}

interface SeatLockView {
  readonly seatId: string;
  readonly mine: boolean;
}

interface SeatLockResponse {
  readonly locks?: readonly SeatLockView[];
  readonly rejected?: readonly string[];
}

/**
 * Khoá ghế theo thời gian thực cho bước chọn ghế.
 *
 * Trả về danh sách ghế đang bị phiên khác giữ để sơ đồ ghế khoá lại ngay, đồng
 * thời báo ngược qua `onSeatsLost` khi ghế mình vừa bấm bị người khác giành mất
 * (hai phiên bấm gần như cùng lúc thì server chỉ chấp nhận một).
 */
export function useSeatLocks({
  showtimeId,
  selectedSeatIds,
  onSeatsLost,
}: {
  readonly showtimeId: string | null;
  readonly selectedSeatIds: readonly string[];
  readonly onSeatsLost: (seatIds: readonly string[]) => void;
}) {
  const [seatIdsHeldByOthers, setSeatIdsHeldByOthers] = useState<
    readonly string[]
  >([]);
  const clientIdRef = useRef<string | null>(null);
  const selectionKey = selectedSeatIds.join(",");

  const applyResponse = useCallback(
    (data: SeatLockResponse) => {
      setSeatIdsHeldByOthers(
        (data.locks ?? [])
          .filter((lock) => !lock.mine)
          .map((lock) => lock.seatId),
      );

      if (data.rejected?.length) {
        onSeatsLost(data.rejected);
      }
    },
    [onSeatsLost],
  );

  useEffect(() => {
    if (!showtimeId) {
      return;
    }

    clientIdRef.current ??= readClientId();

    const clientId = clientIdRef.current;
    const endpoint = `/api/seat-locks/${encodeURIComponent(showtimeId)}`;
    const controller = new AbortController();

    const sync = async () => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, seatIds: selectionKey.split(",").filter(Boolean) }),
          signal: controller.signal,
        });

        if (response.ok) {
          applyResponse((await response.json()) as SeatLockResponse);
        }
      } catch {
        // Mất mạng tạm thời thì giữ nguyên trạng thái đang hiển thị.
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(
          `${endpoint}?clientId=${encodeURIComponent(clientId)}`,
          { signal: controller.signal },
        );

        if (response.ok) {
          applyResponse((await response.json()) as SeatLockResponse);
        }
      } catch {
        // Bỏ qua, lần poll sau sẽ thử lại.
      }
    };

    void sync();

    const pollTimer = window.setInterval(() => void poll(), pollIntervalMs);
    const heartbeatTimer = window.setInterval(
      () => void sync(),
      heartbeatIntervalMs,
    );

    return () => {
      controller.abort();
      window.clearInterval(pollTimer);
      window.clearInterval(heartbeatTimer);
    };
  }, [applyResponse, selectionKey, showtimeId]);

  /** Nhả toàn bộ ghế đang giữ, dùng khi hết giờ giữ ghế hoặc rời bước chọn ghế. */
  const releaseAll = useCallback(() => {
    const clientId = clientIdRef.current;

    if (!showtimeId || !clientId) {
      return;
    }

    const url = `/api/seat-locks/${encodeURIComponent(showtimeId)}?clientId=${encodeURIComponent(clientId)}`;

    void fetch(url, { method: "DELETE", keepalive: true }).catch(() => {});
    setSeatIdsHeldByOthers([]);
  }, [showtimeId]);

  return { seatIdsHeldByOthers, releaseAll };
}

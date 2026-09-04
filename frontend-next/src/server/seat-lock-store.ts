/**
 * Kho khoá ghế dùng chung cho mọi phiên đang mở cùng một suất chiếu.
 *
 * Mỗi ghế chỉ thuộc về một `clientId` tại một thời điểm, nên hai người cùng bấm
 * một ghế thì người bấm sau bị từ chối ngay thay vì phải đợi tới bước thanh
 * toán mới biết ghế đã mất. Khoá tự hết hạn sau `SEAT_HOLD_SECONDS` để tab bị
 * đóng đột ngột không giữ ghế mãi mãi.
 *
 * Dữ liệu nằm trong RAM của tiến trình Next nên đủ cho môi trường một
 * instance; khi chạy nhiều instance cần thay bằng Redis hoặc bảng trong CSDL
 * (backend NestJS đã có sẵn ràng buộc `uq_bookings_slot` cho việc đó).
 */

/** Thời gian giữ ghế, khớp với đồng hồ đếm ngược ở bước chọn ghế. */
export const SEAT_HOLD_SECONDS = 600;

interface SeatLock {
  readonly clientId: string;
  readonly expiresAt: number;
}

export interface SeatLockView {
  readonly seatId: string;
  readonly mine: boolean;
  readonly expiresAt: number;
}

export interface SyncSeatLocksResult {
  /** Ghế đã giữ được cho người gọi. */
  readonly granted: readonly string[];
  /** Ghế bị người khác giữ mất. */
  readonly rejected: readonly string[];
  readonly locks: readonly SeatLockView[];
}

type ShowtimeLocks = Map<string, SeatLock>;

/**
 * Giữ qua `globalThis` để hot reload của Next dev không thổi bay khoá đang có.
 */
const globalStore = globalThis as typeof globalThis & {
  __cineverseSeatLocks?: Map<string, ShowtimeLocks>;
};

const store: Map<string, ShowtimeLocks> = (globalStore.__cineverseSeatLocks ??=
  new Map());

function getShowtimeLocks(showtimeId: string): ShowtimeLocks {
  const existing = store.get(showtimeId);

  if (existing) {
    return existing;
  }

  const created: ShowtimeLocks = new Map();
  store.set(showtimeId, created);

  return created;
}

/** Dọn khoá hết hạn trước mỗi thao tác để không cần cron riêng. */
function dropExpiredLocks(locks: ShowtimeLocks, now: number) {
  for (const [seatId, lock] of locks) {
    if (lock.expiresAt <= now) {
      locks.delete(seatId);
    }
  }
}

function toView(locks: ShowtimeLocks, clientId: string): SeatLockView[] {
  return [...locks].map(([seatId, lock]) => ({
    seatId,
    mine: lock.clientId === clientId,
    expiresAt: lock.expiresAt,
  }));
}

export function readSeatLocks(
  showtimeId: string,
  clientId: string,
): SeatLockView[] {
  const locks = getShowtimeLocks(showtimeId);
  dropExpiredLocks(locks, Date.now());

  return toView(locks, clientId);
}

/**
 * Đồng bộ đúng tập ghế mà một phiên đang chọn: ghế bỏ chọn được nhả ra, ghế mới
 * chỉ giữ được khi chưa ai giữ, còn ghế đang giữ thì được gia hạn thêm.
 */
export function syncSeatLocks(
  showtimeId: string,
  clientId: string,
  seatIds: readonly string[],
): SyncSeatLocksResult {
  const now = Date.now();
  const locks = getShowtimeLocks(showtimeId);
  dropExpiredLocks(locks, now);

  const wanted = new Set(seatIds);

  for (const [seatId, lock] of locks) {
    if (lock.clientId === clientId && !wanted.has(seatId)) {
      locks.delete(seatId);
    }
  }

  const expiresAt = now + SEAT_HOLD_SECONDS * 1000;
  const granted: string[] = [];
  const rejected: string[] = [];

  for (const seatId of wanted) {
    const holder = locks.get(seatId);

    if (holder && holder.clientId !== clientId) {
      rejected.push(seatId);
      continue;
    }

    locks.set(seatId, { clientId, expiresAt });
    granted.push(seatId);
  }

  return { granted, rejected, locks: toView(locks, clientId) };
}

/** Nhả toàn bộ ghế của một phiên, dùng khi rời bước chọn ghế hoặc hết giờ giữ. */
export function releaseSeatLocks(showtimeId: string, clientId: string) {
  const locks = getShowtimeLocks(showtimeId);
  dropExpiredLocks(locks, Date.now());

  for (const [seatId, lock] of locks) {
    if (lock.clientId === clientId) {
      locks.delete(seatId);
    }
  }
}

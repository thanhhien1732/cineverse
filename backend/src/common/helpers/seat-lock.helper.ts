/**
 * Khoá chống đặt trùng ghế.
 *
 * Mỗi ghế đang được giữ hoặc đã thanh toán chiếm đúng một giá trị
 * `"showtimeId:seatId"` trong cột `Bookings.bookingSlot` — cột này có UNIQUE
 * INDEX nên CSDL sẽ từ chối request thứ hai khi hai người cùng bấm một ghế.
 * Ghế bị huỷ hoặc hết hạn giữ thì trả cột về NULL để đặt lại được.
 */
export function buildSeatLockKey(showtimeId: number, seatId: number): string {
    return `${showtimeId}:${seatId}`;
}

/** Thời gian giữ ghế trước khi job dọn dẹp tự huỷ booking chưa thanh toán. */
export const SEAT_HOLD_MINUTES = 10;

/** Dữ liệu cần ghi khi nhả ghế (huỷ, hết hạn giữ, hoặc thanh toán thất bại). */
export const releaseSeatLockData = {
    isBooked: false,
    paymentStatus: 'CANCELED',
    bookingDateTime: null,
    bookingSlot: null,
} as const;

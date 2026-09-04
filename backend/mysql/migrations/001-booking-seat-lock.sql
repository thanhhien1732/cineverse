-- ---------------------------------------------------------------------------
-- Chống hai người đặt trùng một ghế trong cùng một suất chiếu.
--
-- Trước đây BookingService kiểm tra "ghế đã có ai đặt chưa" rồi mới INSERT.
-- Hai request đồng thời đều vượt qua bước kiểm tra và cùng ghi được một ghế
-- (race condition). Cách chắc chắn duy nhất là để chính CSDL từ chối bản ghi
-- thứ hai bằng một UNIQUE INDEX.
--
-- MySQL không có partial unique index nên dùng cột `bookingSlot`:
--   - đang giữ ghế (PENDING) hoặc đã thanh toán (PAID) -> "showtimeId:seatId"
--   - booking bị huỷ / hết hạn giữ ghế                 -> NULL
-- UNIQUE INDEX của MySQL bỏ qua giá trị NULL, nên ghế đã huỷ vẫn đặt lại được
-- mà vẫn giữ nguyên lịch sử booking cũ.
-- ---------------------------------------------------------------------------

ALTER TABLE `Bookings`
  ADD COLUMN `bookingSlot` VARCHAR(64) NULL AFTER `paidAt`;

-- Điền dữ liệu cho các booking đang còn hiệu lực.
UPDATE `Bookings`
SET `bookingSlot` = CONCAT(`showtimeId`, ':', `seatId`)
WHERE `isBooked` = 1
  AND `paymentStatus` IN ('PENDING', 'PAID');

-- Nếu dữ liệu cũ đã lỡ có ghế trùng, chỉ giữ lại booking sớm nhất cho mỗi ghế
-- và huỷ các booking trùng phía sau (nếu không, ADD UNIQUE bên dưới sẽ lỗi).
UPDATE `Bookings` AS b
JOIN (
  SELECT `showtimeId`, `seatId`, MIN(`bookingId`) AS keepId
  FROM `Bookings`
  WHERE `bookingSlot` IS NOT NULL
  GROUP BY `showtimeId`, `seatId`
  HAVING COUNT(*) > 1
) AS dup
  ON dup.`showtimeId` = b.`showtimeId`
 AND dup.`seatId` = b.`seatId`
SET b.`bookingSlot` = NULL,
    b.`isBooked` = 0,
    b.`paymentStatus` = 'CANCELED',
    b.`bookingDateTime` = NULL
WHERE b.`bookingSlot` IS NOT NULL
  AND b.`bookingId` <> dup.keepId;

ALTER TABLE `Bookings`
  ADD UNIQUE INDEX `uq_bookings_slot` (`bookingSlot`);

import type { Cinema, Showtime, ShowtimeAudioMode } from "@/types/domain";

/**
 * Bộ khung giờ chiếu cố định — mỗi cặp (phim, rạp, ngày) chọn một bộ theo seed
 * để danh sách suất chiếu luôn ổn định giữa server và client.
 */
const timeSets: readonly (readonly string[])[] = [
  ["09:30", "12:15", "15:00", "17:45", "20:30", "22:50"],
  ["10:10", "13:05", "16:20", "19:15", "21:55"],
  ["08:50", "11:40", "14:35", "18:05", "20:50", "23:10"],
];

const audioModes: readonly ShowtimeAudioMode[] = ["subtitled", "dubbed"];

export const showtimeDayCount = 7;

function seedFrom(text: string): number {
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) {
    seed += text.charCodeAt(index) * (index + 1);
  }
  return seed;
}

/** Ngày thứ `offset` tính từ hôm nay, dạng `YYYY-MM-DD` theo giờ Việt Nam. */
export function bookingDateAt(offset: number): string {
  const vietnamNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  vietnamNow.setUTCDate(vietnamNow.getUTCDate() + offset);
  return vietnamNow.toISOString().slice(0, 10);
}

export function upcomingBookingDates(
  count = showtimeDayCount,
): readonly string[] {
  return Array.from({ length: count }, (_, index) => bookingDateAt(index));
}

/**
 * Suất chiếu của một phim tại một rạp trong một ngày (`YYYY-MM-DD`).
 *
 * Mỗi rạp mở 2-3 nhóm (định dạng + ngôn ngữ) rồi chia đều các khung giờ cho
 * từng nhóm, để mỗi nhóm luôn có vài suất thay vì mỗi nhóm một suất lẻ.
 */
export function buildShowtimesFor(
  movieId: string,
  cinema: Cinema,
  date: string,
): readonly Showtime[] {
  const seed = seedFrom(`${movieId}|${cinema.id}|${date}`);
  const times = timeSets[seed % timeSets.length];
  const formats = cinema.features?.includes("IMAX")
    ? ["2D", "IMAX", "3D"]
    : ["2D", "3D"];

  const variants = formats.map((format, formatIndex) => ({
    format,
    audioMode: audioModes[(seed + formatIndex) % audioModes.length],
  }));

  return times.map((time, timeIndex) => {
    const variant = variants[timeIndex % variants.length];

    return {
      id: `${movieId}__${cinema.id}__${date}__${time}`,
      movieId,
      cinemaId: cinema.id,
      startsAt: `${date}T${time}:00+07:00`,
      format: variant.format,
      audioMode: variant.audioMode,
      hall: `Cinema ${((seed + timeIndex) % 8) + 1}`,
      basePrice:
        variant.format === "IMAX"
          ? 125000
          : variant.format === "3D"
            ? 110000
            : 95000,
    };
  });
}

export function buildShowtimesForMovie(
  movieId: string,
  cinemas: readonly Cinema[],
  dates: readonly string[] = upcomingBookingDates(),
): readonly Showtime[] {
  return dates.flatMap((date) =>
    cinemas.flatMap((cinema) => buildShowtimesFor(movieId, cinema, date)),
  );
}

/**
 * Suất chiếu ứng với một id đã phát ra. Id tự mô tả (`phim__rạp__ngày__giờ`)
 * nên chỉ cần dựng lại đúng một rạp trong đúng một ngày, không phải dò cả lịch.
 */
export function resolveShowtimeById(
  id: string | null,
  cinemas: readonly Cinema[],
): Showtime | null {
  if (!id) {
    return null;
  }

  const [movieId, cinemaId, date] = id.split("__");
  const cinema = cinemas.find((item) => item.id === cinemaId);

  if (!movieId || !cinema || !date) {
    return null;
  }

  return (
    buildShowtimesFor(movieId, cinema, date).find(
      (showtime) => showtime.id === id,
    ) ?? null
  );
}

/**
 * Suất chiếu đã qua giờ bắt đầu thì ngừng bán vé. `now` là `null` khi phía
 * client chưa đọc được đồng hồ (lần render đầu) — khi đó chưa loại suất nào.
 */
export function hasShowtimeStarted(
  showtime: Showtime,
  now: number | null,
): boolean {
  return now !== null && new Date(showtime.startsAt).getTime() <= now;
}

/** Nhãn nhóm suất chiếu, ví dụ `2D Phụ đề`. */
export function showtimeGroupLabel(showtime: Showtime): string {
  return `${showtime.format} ${
    showtime.audioMode === "dubbed" ? "Lồng tiếng" : "Phụ đề"
  }`;
}

const hourMinute = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function showtimeStartLabel(showtime: Showtime): string {
  return hourMinute.format(new Date(showtime.startsAt));
}

/** Giờ kết thúc ước lượng = giờ bắt đầu + thời lượng phim. */
export function showtimeEndLabel(
  showtime: Showtime,
  durationMinutes: number,
): string {
  const end = new Date(
    new Date(showtime.startsAt).getTime() + durationMinutes * 60 * 1000,
  );
  return hourMinute.format(end);
}

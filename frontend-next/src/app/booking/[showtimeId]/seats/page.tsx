import { SeatPicker } from "@/components/booking/seat-picker";
import {
  resolveShowtimeById,
  showtimeEndLabel,
  showtimeGroupLabel,
  showtimeStartLabel,
} from "@/lib/showtime-schedule";
import {
  mockCatalogueRepository,
  mockShowtimeRepository,
} from "@/services/mock-repositories";

const fullDate = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** Dòng tóm tắt suất chiếu hiển thị ngay dưới nút quay lại. */
async function buildShowtimeSummary(showtimeId: string) {
  const cinemas = await mockShowtimeRepository.findCinemas();
  const showtime = resolveShowtimeById(showtimeId, cinemas);

  if (!showtime) {
    return null;
  }

  const [movie, cinema] = [
    await mockCatalogueRepository.findMovieById(showtime.movieId),
    cinemas.find((item) => item.id === showtime.cinemaId),
  ];

  if (!movie || !cinema) {
    return null;
  }

  return {
    movieTitle: movie.title,
    posterPath: movie.posterPath,
    cinemaName: cinema.name,
    hall: `Phòng chiếu ${showtime.hall}`,
    dateLabel: fullDate.format(new Date(showtime.startsAt)),
    timeLabel: `${showtimeStartLabel(showtime)} ~ ${showtimeEndLabel(showtime, movie.durationMinutes)}`,
    formatLabel: showtimeGroupLabel(showtime),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  const { showtimeId } = await params;
  const summary = await buildShowtimeSummary(decodeURIComponent(showtimeId));

  return (
    <section className="mx-auto max-w-340 px-page py-section">
      <p className="text-xs font-bold tracking-[.2em] text-cv-primary-bright uppercase">
        Đặt vé
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase">Chọn ghế</h1>
      <p className="mt-4 text-muted-foreground">
        Chọn vị trí ngồi phù hợp cho suất chiếu bạn vừa chọn.
      </p>
      <div className="mt-10">
        <SeatPicker showtimeSummary={summary} />
      </div>
    </section>
  );
}

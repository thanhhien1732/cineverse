import Image from "next/image";
import {
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  MapPinIcon,
  ProjectorIcon,
} from "lucide-react";

/** Thông tin suất chiếu hiển thị lại ở các bước sau của luồng đặt vé. */
export interface BookingShowtimeSummary {
  readonly movieTitle: string;
  /** Mã phân loại độ tuổi (P, K, C13…) hiển thị cạnh tên phim. */
  readonly ratingCode: string;
  readonly posterPath: string;
  readonly cinemaName: string;
  readonly hall: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly formatLabel: string;
}

export function ShowtimeSummaryCard({
  summary,
  eyebrow = "Suất chiếu đã chọn",
}: {
  summary: BookingShowtimeSummary;
  eyebrow?: string;
}) {
  return (
    <div className="seat-showtime-card">
      <Image
        alt=""
        aria-hidden
        className="seat-showtime-poster"
        height={90}
        loading="eager"
        src={summary.posterPath}
        width={60}
      />
      <div>
        <p className="seat-showtime-eyebrow">{eyebrow}</p>
        <div className="seat-showtime-heading">
          <h2 className="seat-showtime-title">{summary.movieTitle}</h2>
          <span
            className="seat-showtime-rating"
            title={`Phân loại độ tuổi: ${summary.ratingCode}`}
          >
            {summary.ratingCode}
          </span>
        </div>
        <div className="seat-showtime-meta">
          <span>
            <MapPinIcon aria-hidden="true" />
            {summary.cinemaName}
          </span>
          <span>
            <CalendarIcon aria-hidden="true" />
            {summary.dateLabel}
          </span>
          <span>
            <ClockIcon aria-hidden="true" />
            {summary.timeLabel}
          </span>
          <span>
            <ProjectorIcon aria-hidden="true" />
            {summary.hall}
          </span>
          <span>
            <ClapperboardIcon aria-hidden="true" />
            {summary.formatLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

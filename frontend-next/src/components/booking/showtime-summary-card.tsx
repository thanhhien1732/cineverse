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
        <h2 className="seat-showtime-title">{summary.movieTitle}</h2>
        <div className="seat-showtime-meta">
          <span>
            <MapPinIcon aria-hidden="true" />
            {summary.cinemaName}
          </span>
          <span>
            <ProjectorIcon aria-hidden="true" />
            {summary.hall}
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
            <ClapperboardIcon aria-hidden="true" />
            {summary.formatLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

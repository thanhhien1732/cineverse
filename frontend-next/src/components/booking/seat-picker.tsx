"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  MapPinIcon,
  ProjectorIcon,
  TicketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingSteps } from "@/components/booking/booking-flow";
import { SeatHoldTimer } from "@/components/booking/seat-hold-timer";
import { useBookingStore } from "@/lib/stores/booking.store";
import { cn } from "@/lib/utils";
import type { Seat } from "@/types/domain";

interface SeatMapItem extends Seat {
  readonly row: string;
}

const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const standardSeats: readonly SeatMapItem[] = seatRows.flatMap((row) =>
  Array.from({ length: 12 }, (_, index) => {
    const label = `${row}${index + 1}`;
    const kind = ["G", "H", "I"].includes(row) ? "vip" : "standard";

    return {
      id: label,
      label,
      row,
      kind,
      priceMultiplier: kind === "vip" ? 1.32 : 1,
    };
  }),
);
const coupleSeats: readonly SeatMapItem[] = Array.from(
  { length: 6 },
  (_, index) => {
    const firstSeatNumber = index * 2 + 1;
    const label = `J${firstSeatNumber}-J${firstSeatNumber + 1}`;

    return {
      id: label,
      label,
      row: "J",
      kind: "couple",
      priceMultiplier: 2,
    };
  },
);
const seats: readonly SeatMapItem[] = [...standardSeats, ...coupleSeats];
const reservedSeatIds = new Set([
  "A3",
  "A9",
  "B1",
  "B7",
  "C4",
  "C11",
  "D2",
  "D8",
  "E5",
  "E12",
  "F3",
  "F9",
  "G1",
  "G6",
  "G11",
  "H4",
  "H8",
  "I2",
  "I7",
  "I12",
  "J1-J2",
  "J9-J10",
]);
const maximumSeatSelection = 8;
const minSeatMapZoom = 0.6;
const maxSeatMapZoom = 2;
const baseSeatPrice = 95000;

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function SeatSelectionSummary({
  selectedSeatIds,
  canContinue,
  onContinue,
}: {
  selectedSeatIds: readonly string[];
  canContinue: boolean;
  onContinue: () => void;
}) {
  const chosen = selectedSeatIds
    .map((id) => seats.find((seat) => seat.id === id))
    .filter((seat): seat is SeatMapItem => seat !== undefined);

  const seatSubtotal = chosen.reduce(
    (total, seat) => total + baseSeatPrice * seat.priceMultiplier,
    0,
  );
  /** Ghế đôi tính là hai lượt khách. */
  const admissionCount = chosen.reduce(
    (total, seat) => total + (seat.kind === "couple" ? 2 : 1),
    0,
  );

  return (
    <aside className="booking-summary-panel rounded-xl border border-border bg-surface p-5 shadow-cinema">
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cv-primary-bright/10 text-cv-primary-bright">
          <TicketIcon className="size-4.5" />
        </span>
        <div className="grid gap-0.5">
          <p className="text-[.63rem] font-extrabold tracking-[.11em] text-muted-foreground uppercase">
            Ghế đã chọn
          </p>
          <p className="font-bold leading-tight">
            {admissionCount} vé · tối đa {maximumSeatSelection} lựa chọn
          </p>
        </div>
      </div>

      <div className="selected-seat-list" aria-label="Ghế đã chọn">
        {chosen.length ? (
          chosen.map((seat) => (
            <span className="selected-seat-pill" key={seat.id}>
              {seat.label}
            </span>
          ))
        ) : (
          <p className="summary-empty">Chưa chọn ghế nào.</p>
        )}
      </div>

      <dl className="summary-list">
        <div className="summary-total">
          <dt>Tạm tính</dt>
          <dd>{money.format(seatSubtotal)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="summary-cta-button"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Tiếp tục
        <ArrowRightIcon />
      </button>
    </aside>
  );
}

function SeatLegend() {
  return (
    <div className="seat-legend" aria-label="Chú thích trạng thái ghế">
      <span>
        <i /> Thường
      </span>
      <span>
        <i className="legend-vip" /> VIP
      </span>
      <span>
        <i className="legend-couple" /> Sweetbox
      </span>
      <span>
        <i className="legend-selected" /> Đang chọn
      </span>
      <span>
        <i className="legend-reserved" /> Đã đặt
      </span>
    </div>
  );
}

export interface SeatShowtimeSummary {
  readonly movieTitle: string;
  readonly posterPath: string;
  readonly cinemaName: string;
  readonly hall: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly formatLabel: string;
}

export function SeatPicker({
  showtimeSummary,
}: {
  showtimeSummary: SeatShowtimeSummary | null;
}) {
  const router = useRouter();
  const selectedSeatIds = useBookingStore((state) => state.seatIds);
  const showtimeId = useBookingStore((state) => state.showtimeId);
  const movieId = useBookingStore((state) => state.movieId);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const clearSeats = useBookingStore((state) => state.clearSeats);
  const [expired, setExpired] = useState(false);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const seatMapShellRef = useRef<HTMLDivElement>(null);

  /** Giữ lại phim đang đặt để quay về đúng bước chọn suất chiếu của phim đó. */
  const showtimesHref = movieId
    ? `/showtimes?movie=${encodeURIComponent(movieId)}`
    : "/showtimes";

  /**
   * React đăng ký onWheel dưới dạng passive nên preventDefault() không có
   * tác dụng — phải gắn listener gốc để chặn cuộn trang khi zoom sơ đồ ghế.
   */
  useEffect(() => {
    const shell = seatMapShellRef.current;
    if (!shell) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) =>
        Math.min(
          maxSeatMapZoom,
          Math.max(minSeatMapZoom, current - event.deltaY * 0.0015),
        ),
      );
    };

    shell.addEventListener("wheel", handleWheel, { passive: false });
    return () => shell.removeEventListener("wheel", handleWheel);
  }, []);

  const handleExpire = useCallback(() => {
    clearSeats();
    setSelectionMessage(null);
    setExpired(true);
  }, [clearSeats]);

  const handleSeatToggle = (seatId: string) => {
    const isSelected = selectedSeatIds.includes(seatId);

    if (!isSelected && selectedSeatIds.length >= maximumSeatSelection) {
      setSelectionMessage(
        `Bạn chỉ có thể chọn tối đa ${maximumSeatSelection} ghế trong một đơn.`,
      );
      return;
    }

    toggleSeat(seatId);
    setSelectionMessage(null);
  };

  if (expired) {
    return (
      <div>
        <BookingSteps active={2} />
        <section
          aria-live="assertive"
          className="mx-auto max-w-2xl rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center"
        >
          <p className="text-xs font-black tracking-[0.16em] text-destructive">
            PHIÊN GIỮ GHẾ ĐÃ HẾT HẠN
          </p>
          <h2 className="mt-3 text-2xl font-black">Ghế đã được giải phóng</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Thời gian giữ ghế 10 phút đã kết thúc. Vui lòng chọn lại suất chiếu
            để bắt đầu một phiên đặt vé mới.
          </p>
          <Button className="mt-6" onClick={() => router.push(showtimesHref)}>
            Chọn lại suất chiếu
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div>
      <BookingSteps active={2} />
      <Link className="home-text-link text-link-back" href={showtimesHref}>
        <ArrowLeftIcon aria-hidden="true" />
        Quay lại
      </Link>
      <div className="seat-context">
        {showtimeSummary && (
          <div className="seat-showtime-card">
            <Image
              alt=""
              aria-hidden
              className="seat-showtime-poster"
              height={90}
              loading="eager"
              src={showtimeSummary.posterPath}
              width={60}
            />
            <div>
              <p className="seat-showtime-eyebrow">Suất chiếu đã chọn</p>
              <h2 className="seat-showtime-title">
                {showtimeSummary.movieTitle}
              </h2>
              <div className="seat-showtime-meta">
                <span>
                  <MapPinIcon aria-hidden="true" />
                  {showtimeSummary.cinemaName}
                </span>
                <span>
                  <ProjectorIcon aria-hidden="true" />
                  {showtimeSummary.hall}
                </span>
                <span>
                  <CalendarIcon aria-hidden="true" />
                  {showtimeSummary.dateLabel}
                </span>
                <span>
                  <ClockIcon aria-hidden="true" />
                  {showtimeSummary.timeLabel}
                </span>
                <span>
                  <ClapperboardIcon aria-hidden="true" />
                  {showtimeSummary.formatLabel}
                </span>
              </div>
            </div>
          </div>
        )}
        <SeatHoldTimer durationSeconds={600} onExpire={handleExpire} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <div className="seat-map-shell" ref={seatMapShellRef}>
            {zoom !== 1 && (
              <button
                type="button"
                className="seat-map-zoom-badge"
                onClick={() => setZoom(1)}
              >
                {Math.round(zoom * 100)}%
              </button>
            )}
            <div
              className="seat-map-zoom"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="screen">
                <span>MÀN HÌNH</span>
              </div>
              <div className="seat-map">
                {seatRows.map((row) => (
                <div className="seat-row" key={row}>
                  <b>{row}</b>
                  <div className="seat-row-inner">
                    {seats
                      .filter((seat) => seat.row === row)
                      .map((seat, index) => {
                        const isReserved = reservedSeatIds.has(seat.id);
                        const isSelected = selectedSeatIds.includes(seat.id);

                        return (
                          <div className="contents" key={seat.id}>
                            {index === 6 && <span className="seat-aisle" />}
                            <button
                              type="button"
                              aria-label={`Ghế ${seat.label}${isReserved ? ", đã đặt" : ""}`}
                              aria-pressed={isSelected}
                              className={cn(
                                "seat",
                                `seat-${seat.kind}`,
                                isSelected && "is-selected",
                                isReserved && "is-reserved",
                              )}
                              disabled={isReserved}
                              onClick={() => handleSeatToggle(seat.id)}
                            >
                              <span>{seat.label}</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <b>{row}</b>
                </div>
              ))}
              <div className="seat-row">
                <b>J</b>
                <div className="seat-row-inner">
                  {coupleSeats.map((seat) => {
                    const isReserved = reservedSeatIds.has(seat.id);
                    const isSelected = selectedSeatIds.includes(seat.id);

                    return (
                      <button
                        type="button"
                        aria-label={`Ghế đôi ${seat.label}${isReserved ? ", đã đặt" : ""}`}
                        aria-pressed={isSelected}
                        className={cn(
                          "seat seat-couple",
                          isSelected && "is-selected",
                          isReserved && "is-reserved",
                        )}
                        disabled={isReserved}
                        key={seat.id}
                        onClick={() => handleSeatToggle(seat.id)}
                      >
                        <span>{seat.label.replace("-J", "-")}</span>
                      </button>
                    );
                  })}
                </div>
                <b>J</b>
              </div>
              </div>
            </div>
          </div>
          <SeatLegend />
          {selectionMessage && (
            <p
              aria-live="polite"
              className="mt-4 text-sm font-semibold text-destructive"
            >
              {selectionMessage}
            </p>
          )}
        </section>
        <SeatSelectionSummary
          selectedSeatIds={selectedSeatIds}
          canContinue={Boolean(showtimeId) && selectedSeatIds.length > 0}
          onContinue={() => router.push("/booking/combos")}
        />
      </div>
    </div>
  );
}

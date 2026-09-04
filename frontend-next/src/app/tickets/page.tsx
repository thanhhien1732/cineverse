"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ArrowRightIcon, TicketIcon } from "lucide-react";
import { useBookingStore } from "@/lib/stores/booking.store";
import { useCurrentProfile } from "@/lib/stores/auth.store";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types/domain";

/** Mốc thời gian lúc mở trang, dùng để suy ra trạng thái suất chiếu. */
const openedAt = Date.now();

/** Thời lượng mặc định cho vé cũ chưa lưu thời lượng phim. */
const fallbackDurationMinutes = 120;

type TicketPhase = "upcoming" | "playing" | "finished";

const phaseLabels: Readonly<Record<TicketPhase, string>> = {
  upcoming: "Sắp chiếu",
  playing: "Đang chiếu",
  finished: "Đã chiếu",
};

/** Ghế đôi `J1-J2` được tách thành hai lượt vào cửa, giống frontend legacy. */
function expandAdmissionSeats(seatLabels: readonly string[]) {
  return seatLabels.flatMap((label) =>
    label.includes("-") ? label.split("-") : [label],
  );
}

function showtimeDate(ticket: Ticket) {
  const startsAt = ticket.details?.startsAt;

  if (!startsAt) {
    return null;
  }

  const date = new Date(startsAt);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Suất chiếu đang diễn ra được tính từ giờ bắt đầu đến khi phim kết thúc. */
function getTicketPhase(ticket: Ticket): TicketPhase {
  const startsAt = showtimeDate(ticket);

  if (!startsAt) {
    return "upcoming";
  }

  const startTime = startsAt.getTime();
  const durationMinutes =
    ticket.details?.durationMinutes || fallbackDurationMinutes;

  if (openedAt < startTime) {
    return "upcoming";
  }

  return openedAt < startTime + durationMinutes * 60000
    ? "playing"
    : "finished";
}

function WalletTicketCard({
  ticket,
  isLatest,
}: {
  readonly ticket: Ticket;
  readonly isLatest: boolean;
}) {
  const details = ticket.details;
  const startsAt = showtimeDate(ticket);
  const phase = getTicketPhase(ticket);

  return (
    <article className="wallet-ticket-card">
      <Link className="wallet-ticket-poster" href={`/ticket/${ticket.id}`}>
        {details?.posterPath && (
          <Image
            alt={`Poster phim ${ticket.movieTitle}`}
            height={444}
            src={details.posterPath}
            width={296}
          />
        )}
      </Link>
      <div className="wallet-ticket-content">
        <div className="wallet-ticket-head">
          <div>
            <p className="eyebrow">
              {isLatest ? "Vé mua gần nhất" : "Vé đã mua"}
            </p>
            <h2>{ticket.movieTitle}</h2>
          </div>
          <span className={cn("wallet-ticket-status", `is-${phase}`)}>
            {phaseLabels[phase]}
          </span>
        </div>
        <dl className="wallet-ticket-meta">
          <div>
            <dt>Ngày chiếu</dt>
            <dd>{details?.dateLabel ?? "—"}</dd>
          </div>
          <div>
            <dt>Suất chiếu</dt>
            <dd>{details?.timeLabel ?? "—"}</dd>
          </div>
          <div>
            <dt>Rạp</dt>
            <dd>{details?.cinemaName ?? "—"}</dd>
          </div>
          <div>
            <dt>Phòng</dt>
            <dd>{details?.hall ?? "—"}</dd>
          </div>
          <div>
            <dt>Ghế</dt>
            <dd>{expandAdmissionSeats(ticket.seatLabels).join(", ")}</dd>
          </div>
          <div>
            <dt>Thanh toán</dt>
            <dd>{details?.paymentLabel ?? "—"}</dd>
          </div>
        </dl>
        <div className="wallet-ticket-footer">
          <span>
            <strong>{ticket.code}</strong>
            {startsAt && <small>{startsAt.toLocaleString("vi-VN")}</small>}
          </span>
          <Link className="wallet-ticket-open" href={`/ticket/${ticket.id}`}>
            Mở vé
            <ArrowRightIcon aria-hidden="true" className="size-4.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Page() {
  const router = useRouter();
  const tickets = useBookingStore((state) => state.tickets);
  const profile = useCurrentProfile();

  useEffect(() => {
    if (!profile) {
      router.replace("/auth?next=/tickets");
    }
  }, [profile, router]);

  /** Vé mới mua nhất đứng đầu, giống thứ tự lịch sử vé của legacy. */
  const purchaseHistory = useMemo(
    () =>
      [...tickets].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [tickets],
  );
  const latestTicket = purchaseHistory[0];

  if (!profile) {
    return null;
  }

  return (
    <>
      <section className="ticket-wallet-hero">
        <div className="home-container wallet-heading">
          <div>
            <p className="eyebrow">CINEVERSE E-TICKETS</p>
            <h1>Vé của bạn</h1>
            <p>Toàn bộ vé điện tử bạn đã mua tại CINEVERSE.</p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container">
          {purchaseHistory.length > 0 ? (
            <div className="wallet-ticket-grid">
              {purchaseHistory.map((ticket) => (
                <WalletTicketCard
                  isLatest={ticket.id === latestTicket?.id}
                  key={ticket.id}
                  ticket={ticket}
                />
              ))}
            </div>
          ) : (
            <div className="wallet-empty-state">
              <span aria-hidden="true">
                <TicketIcon className="size-8.5" />
              </span>
              <h2>Chưa có vé nào</h2>
              <p>Chọn phim và hoàn tất thanh toán để nhận vé điện tử.</p>
              <div className="wallet-empty-actions">
                <Link
                  className="wallet-action wallet-action-primary"
                  href="/movies"
                >
                  Chọn phim ngay
                  <ArrowRightIcon aria-hidden="true" className="size-4.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

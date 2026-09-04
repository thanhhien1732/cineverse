"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckIcon, HomeIcon, PrinterIcon, StarIcon } from "lucide-react";
import type { Ticket, TicketDetails } from "@/types/domain";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const issuedAtFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const gateNotice =
  "Xuất trình QR tại cổng kiểm soát vé. Mang giấy tờ tùy thân khi rạp yêu cầu đối chiếu.";

const emptyDetails: TicketDetails = {
  posterPath: "",
  ratingCode: "P",
  cinemaName: "CINEVERSE",
  hall: "—",
  formatLabel: "—",
  startsAt: "",
  durationMinutes: 0,
  dateLabel: "—",
  timeLabel: "—",
  paymentLabel: "Thẻ ngân hàng",
  admissionCount: 1,
  verifiedAge: null,
  seatSubtotal: 0,
  comboSubtotal: 0,
  voucherDiscount: 0,
  pointsDiscount: 0,
  comboLines: [],
  earnedPoints: 0,
  tierLabel: "Fan Bắp Rang",
};

/** Băm FNV-1a như frontend legacy, dùng làm seed cho mã vạch và ảnh QR. */
function hashCode(text: string) {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

/** Một trong 512 ảnh QR tĩnh trong `public/assets/qr`, cố định theo mã vé. */
function qrAssetPath(code: string) {
  const qrId = String((hashCode(code) % 512) + 1).padStart(6, "0");

  return `/assets/qr/cvqr-${qrId}.svg`;
}

function barcodeBars(code: string) {
  const seed = hashCode(code);

  return Array.from({ length: 54 }, (_, index) => ({
    width: (seed >> index % 16) & 1 ? 3 : 1,
    gap: ((seed + index * 7) % 3) + 1,
  }));
}

/** Ghế đôi `J1-J2` được tách thành hai lượt vào cửa, giống legacy. */
function expandAdmissionSeats(seatLabels: readonly string[]) {
  return seatLabels.flatMap((label) =>
    label.includes("-") ? label.split("-") : [label],
  );
}

export function TicketView({ ticket }: { readonly ticket: Ticket }) {
  const details = ticket.details ?? emptyDetails;
  const seatLabels = expandAdmissionSeats(ticket.seatLabels).join(", ");
  const admissionCount =
    details.admissionCount || expandAdmissionSeats(ticket.seatLabels).length;
  const ageLabel =
    details.verifiedAge === null
      ? details.ratingCode
      : `${details.ratingCode} · ${details.verifiedAge} tuổi`;

  return (
    <div className="ticket-layout">
      <article className="ticket-card cinema-ticket">
        <header className="ticket-brandbar">
          <div className="ticket-brandmark">
            <Image
              alt="CINEVERSE"
              height={26}
              priority
              src="/assets/logo.svg"
              unoptimized
              width={148}
            />
            <span>CINEMA ADMISSION TICKET</span>
          </div>
          <strong>ADMIT {admissionCount}</strong>
        </header>

        <div className="ticket-card-body">
          <div className="ticket-poster">
            {details.posterPath && (
              <Image
                alt={`Poster phim ${ticket.movieTitle}`}
                height={444}
                src={details.posterPath}
                width={296}
              />
            )}
          </div>

          <div className="ticket-info">
            <p className="eyebrow">CINEVERSE E-TICKET · {details.ratingCode}</p>
            <h2>{ticket.movieTitle}</h2>

            <div className="ticket-primary-row">
              <div>
                <small>Ngày chiếu</small>
                <strong>{details.dateLabel}</strong>
              </div>
              <div>
                <small>Suất chiếu</small>
                <strong>{details.timeLabel}</strong>
              </div>
              <div>
                <small>Phòng</small>
                <strong>{details.hall}</strong>
              </div>
              <div>
                <small>Ghế</small>
                <strong>{seatLabels}</strong>
              </div>
            </div>

            <div className="ticket-meta-grid">
              <div>
                <small>Rạp chiếu</small>
                <strong>{details.cinemaName}</strong>
              </div>
              <div>
                <small>Định dạng</small>
                <strong>{details.formatLabel}</strong>
              </div>
              <div>
                <small>Khách hàng</small>
                <strong>{ticket.customerName || "Khách CINEVERSE"}</strong>
              </div>
              <div>
                <small>Xác thực tuổi</small>
                <strong>{ageLabel}</strong>
              </div>
              <div>
                <small>Thanh toán</small>
                <strong>Đã thanh toán · {details.paymentLabel}</strong>
              </div>
            </div>
          </div>

          <aside className="ticket-stub">
            <small className="ticket-stub-label">Scan at gate</small>
            <Image
              alt={`Mã QR vé điện tử ${ticket.code}`}
              className="ticket-qr-image"
              height={116}
              src={qrAssetPath(ticket.code)}
              unoptimized
              width={116}
            />
            <strong>{ticket.code}</strong>
            <dl>
              <div>
                <dt>Ghế</dt>
                <dd>{seatLabels}</dd>
              </div>
              <div>
                <dt>Phòng</dt>
                <dd>{details.hall}</dd>
              </div>
              <div>
                <dt>Giờ</dt>
                <dd>{details.timeLabel}</dd>
              </div>
            </dl>
            <span>Giữ vé đến hết suất chiếu</span>
          </aside>
        </div>

        <footer className="ticket-terms">
          <div>
            <strong>{ticket.code}</strong>
            <span>
              Phát hành: {issuedAtFormat.format(new Date(ticket.createdAt))} ·{" "}
              {gateNotice}
            </span>
          </div>
          <div aria-label="Mã vạch kiểm soát vé" className="ticket-barcode">
            {barcodeBars(ticket.code).map((bar, index) => (
              <i
                key={index}
                style={{ width: bar.width, marginRight: bar.gap }}
              />
            ))}
          </div>
        </footer>
      </article>

      <aside className="ticket-side">
        <div className="ticket-note">
          <span aria-hidden="true">
            <CheckIcon className="size-5" />
          </span>
          <div>
            <strong>Đã xác nhận</strong>
            <p>{gateNotice}</p>
          </div>
        </div>

        <div className="ticket-side-card">
          <h3>Chi tiết thanh toán</h3>
          <dl className="summary-list">
            <div>
              <dt>Tiền vé</dt>
              <dd>{money.format(details.seatSubtotal)}</dd>
            </div>
            <div>
              <dt>Combo</dt>
              <dd>{money.format(details.comboSubtotal)}</dd>
            </div>
            <div>
              <dt>Phương thức</dt>
              <dd>{details.paymentLabel}</dd>
            </div>
            {details.voucherDiscount > 0 && (
              <div className="summary-discount">
                <dt>Voucher CINE20</dt>
                <dd>- {money.format(details.voucherDiscount)}</dd>
              </div>
            )}
            {details.pointsDiscount > 0 && (
              <div className="summary-discount">
                <dt>Điểm CINEVERSE ({ticket.pointsRedeemed ?? 0})</dt>
                <dd>- {money.format(details.pointsDiscount)}</dd>
              </div>
            )}
            <div className="summary-total">
              <dt>Tổng cộng</dt>
              <dd>{money.format(ticket.total)}</dd>
            </div>
          </dl>
          {details.comboLines.length > 0 && (
            <div className="ticket-combos">
              {details.comboLines.map((line) => (
                <p key={line.name}>
                  {line.quantity} × {line.name}
                </p>
              ))}
            </div>
          )}
        </div>

        {(details.earnedPoints > 0 || (ticket.pointsRedeemed ?? 0) > 0) && (
          <div className="ticket-note rewards-ticket-note">
            <span aria-hidden="true">
              <StarIcon className="size-5" />
            </span>
            <div>
              <strong>CINEVERSE Rewards</strong>
              <p>
                {details.earnedPoints > 0 &&
                  `+${details.earnedPoints} điểm tích lũy`}
                {details.earnedPoints > 0 &&
                  (ticket.pointsRedeemed ?? 0) > 0 &&
                  " · "}
                {(ticket.pointsRedeemed ?? 0) > 0 &&
                  `-${ticket.pointsRedeemed} điểm đã sử dụng`}
                {` · Hạng ${details.tierLabel}`}
              </p>
            </div>
          </div>
        )}

        <div className="ticket-actions">
          <button
            className="ticket-action ticket-action-ghost"
            onClick={() => window.print()}
            type="button"
          >
            <PrinterIcon aria-hidden="true" className="size-4.5" />
            In vé xem phim
          </button>
          <Link className="ticket-action ticket-action-primary" href="/">
            <HomeIcon aria-hidden="true" className="size-4.5" />
            Về trang chủ
          </Link>
        </div>
      </aside>
    </div>
  );
}

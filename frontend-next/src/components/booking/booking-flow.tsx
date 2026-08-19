"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, MinusIcon, PlusIcon, PrinterIcon } from "lucide-react";
import { AgeRestrictionModal } from "@/components/booking/age-restriction-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/lib/stores/booking.store";
import type {
  Cinema,
  Combo,
  Movie,
  Seat,
  Showtime,
  Ticket,
} from "@/types/domain";

interface SeatMapItem extends Seat {
  readonly row: string;
}

const standardSeatRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const standardSeats: readonly SeatMapItem[] = standardSeatRows.flatMap((row) =>
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
const seatPlan: readonly SeatMapItem[] = [...standardSeats, ...coupleSeats];
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

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const days = Array.from({ length: 7 }, (_, index) => {
  const value = new Date("2026-08-03T12:00:00+07:00");
  value.setDate(value.getDate() + index);
  return value;
});

export function BookingSteps({ active }: { active: number }) {
  return (
    <ol className="mb-10 grid grid-cols-5 gap-2 text-center text-xs text-muted-foreground">
      {["Suất chiếu", "Ghế ngồi", "Combo", "Thanh toán", "Mã vé"].map(
        (label, index) => (
          <li
            key={label}
            className={index + 1 <= active ? "text-cv-primary-bright" : ""}
          >
            <span className="mx-auto mb-1 flex size-7 items-center justify-center rounded-full border border-current">
              {index + 1 < active ? (
                <CheckIcon className="size-4" />
              ) : (
                index + 1
              )}
            </span>
            {label}
          </li>
        ),
      )}
    </ol>
  );
}

export function BookingSummary({
  movies,
  showtimes,
  combos,
  action,
}: {
  movies: readonly Movie[];
  showtimes: readonly Showtime[];
  combos: readonly Combo[];
  action?: ReactNode;
}) {
  const draft = useBookingStore((state) => state);
  const movie = movies.find((item) => item.id === draft.movieId);
  const showtime = showtimes.find((item) => item.id === draft.showtimeId);

  const seatTotal = draft.seatIds.reduce(
    (total, id) =>
      total +
      95000 * (seatPlan.find((seat) => seat.id === id)?.priceMultiplier ?? 1),
    0,
  );

  const comboTotal = combos.reduce(
    (total, combo) =>
      total + combo.unitPrice * (draft.comboQuantities[combo.id] ?? 0),
    0,
  );

  const admissionCount = draft.seatIds.reduce(
    (total, seatId) =>
      total +
      (seatPlan.find((seat) => seat.id === seatId)?.kind === "couple" ? 2 : 1),
    0,
  );

  return (
    <aside className="booking-summary-panel rounded-xl border border-border bg-surface p-5 shadow-cinema">
      <p className="text-xs font-bold tracking-widest text-primary-bright">
        TÓM TẮT ĐẶT VÉ
      </p>

      <div className="mt-4 grid gap-3 text-sm">
        <p className="font-semibold">{movie?.title ?? "Chưa chọn phim"}</p>
        <p className="text-muted-foreground">
          {showtime
            ? new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(showtime.startsAt))
            : "Chưa chọn suất chiếu"}
        </p>

        <p>
          Ghế:{" "}
          {draft.seatIds.length
            ? draft.seatIds
              .map((id) => seatPlan.find((seat) => seat.id === id)?.label)
              .join(", ")
            : "Chưa chọn"}
        </p>

        {draft.seatIds.length > 0 && (
          <div className="selected-seat-list" aria-label="Ghế đã chọn">
            {draft.seatIds.map((seatId) => (
              <span className="selected-seat-pill" key={seatId}>
                {seatPlan.find((seat) => seat.id === seatId)?.label ?? seatId}
              </span>
            ))}
          </div>
        )}

        {combos
          .filter((combo) => draft.comboQuantities[combo.id])
          .map((combo) => (
            <p key={combo.id}>
              {combo.name} × {draft.comboQuantities[combo.id]}
            </p>
          ))}

        <div className="mt-2 flex justify-between border-t pt-3 text-base font-bold">
          <span>Tổng cộng</span>
          <span>
            {money.format(seatTotal + comboTotal + admissionCount * 5000)}
          </span>
        </div>

        {action}
      </div>
    </aside>
  );
}

export function ShowtimePicker({
  movies,
  cinemas,
  showtimes,
  combos,
}: {
  movies: readonly Movie[];
  cinemas: readonly Cinema[];
  showtimes: readonly Showtime[];
  combos: readonly Combo[];
}) {
  const router = useRouter();
  const [movieId, setMovieId] = useState(
    movies.find((movie) => movie.status === "now-showing")?.id ??
    movies[0]?.id ??
    "",
  );
  const [day, setDay] = useState(days[0].toDateString());
  const [pendingShowtime, setPendingShowtime] = useState<Showtime | null>(null);
  const selectMovie = useBookingStore((state) => state.selectMovie);
  const selectShowtime = useBookingStore((state) => state.selectShowtime);
  const pendingMovie = pendingShowtime
    ? movies.find((movie) => movie.id === pendingShowtime.movieId)
    : null;
  const visible = showtimes.filter(
    (showtime) =>
      showtime.movieId === movieId &&
      new Date(showtime.startsAt).toDateString() === day,
  );
  return (
    <div>
      <BookingSteps active={1} />
      <div className="booking-content-grid grid gap-6">
        <div className="grid gap-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-bold">01. Chọn phim</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {movies
                .filter((movie) => movie.status === "now-showing")
                .map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => {
                      setMovieId(movie.id);
                      setPendingShowtime(null);
                    }}
                    className={cn(
                      "rounded-lg border p-3 text-left",
                      movie.id === movieId
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                  >
                    <span className="block font-semibold">{movie.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {movie.formats.join(" · ")}
                    </span>
                  </button>
                ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-bold">02. Chọn ngày</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {days.map((date) => (
                <Button
                  key={date.toISOString()}
                  type="button"
                  size="sm"
                  variant={day === date.toDateString() ? "default" : "outline"}
                  onClick={() => {
                    setDay(date.toDateString());
                    setPendingShowtime(null);
                  }}
                >
                  {new Intl.DateTimeFormat("vi-VN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                  }).format(date)}
                </Button>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-bold">03. Chọn rạp và suất</h2>
            <div className="mt-4 grid gap-4">
              {cinemas.map((cinema) => {
                const cinemaShows = visible.filter(
                  (showtime) => showtime.cinemaId === cinema.id,
                );
                return (
                  <div
                    key={cinema.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <p className="font-semibold">{cinema.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cinema.address} · {cinema.features?.join(" · ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cinemaShows.map((showtime) => (
                        <Button
                          key={showtime.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingShowtime(showtime)}
                        >
                          {new Intl.DateTimeFormat("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(showtime.startsAt))}{" "}
                          · {showtime.format}
                        </Button>
                      ))}
                      {!cinemaShows.length && (
                        <span className="text-sm text-muted-foreground">
                          Chưa có suất phù hợp.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <BookingSummary movies={movies} showtimes={showtimes} combos={combos} />
      </div>
      <AgeRestrictionModal
        open={pendingShowtime !== null}
        rating={pendingMovie?.ratingLabel ?? "P"}
        onCancel={() => setPendingShowtime(null)}
        onConfirm={() => {
          if (!pendingShowtime) {
            return;
          }

          selectMovie(pendingShowtime.movieId);
          selectShowtime(pendingShowtime.id);
          router.push(`/booking/${pendingShowtime.id}/seats`);
        }}
      />
    </div>
  );
}

export function SeatPicker({
  movies,
  showtimes,
  combos,
}: {
  movies: readonly Movie[];
  showtimes: readonly Showtime[];
  combos: readonly Combo[];
}) {
  const router = useRouter();
  const selected = useBookingStore((state) => state.seatIds);
  const toggle = useBookingStore((state) => state.toggleSeat);
  const showtimeId = useBookingStore((state) => state.showtimeId);
  return (
    <div>
      <BookingSteps active={2} />
      <div className="booking-content-grid grid gap-6">
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-5 text-center text-sm tracking-widest text-muted-foreground">
            MÀN HÌNH
          </p>
          <div className="mx-auto mb-6 h-2 w-4/5 rounded-full bg-primary/70" />
          <div className="grid grid-cols-9 gap-2">
            {seatPlan.map((seat) => {
              const isReserved = reservedSeatIds.has(seat.id);
              const isSelected = selected.includes(seat.id);
              return (
                <button
                  key={seat.id}
                  type="button"
                  aria-label={`Ghế ${seat.label}`}
                  aria-pressed={isSelected}
                  disabled={isReserved}
                  onClick={() => toggle(seat.id)}
                  className={cn(
                    "aspect-square rounded text-[.65rem] font-semibold",
                    isReserved && "bg-muted opacity-40",
                    isSelected && "bg-primary text-primary-foreground",
                    !isReserved &&
                    !isSelected &&
                    seat.kind === "vip" &&
                    "bg-warning text-background",
                    !isReserved &&
                    !isSelected &&
                    seat.kind === "couple" &&
                    "bg-accent text-foreground",
                    !isReserved &&
                    !isSelected &&
                    seat.kind === "standard" &&
                    "bg-surface-raised hover:bg-primary/30",
                  )}
                >
                  {seat.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>■ Thường</span>
            <span className="text-warning">■ VIP</span>
            <span className="text-accent">■ Sweetbox</span>
            <span className="text-primary">■ Đang chọn</span>
            <span>■ Đã đặt</span>
          </div>
          <Button
            className="mt-6"
            disabled={!showtimeId || !selected.length}
            onClick={() => router.push("/booking/combos")}
          >
            Tiếp tục chọn combo
          </Button>
          {!selected.length && (
            <p className="mt-2 text-sm text-destructive">
              Chọn ít nhất một ghế để tiếp tục.
            </p>
          )}
        </section>
        <BookingSummary movies={movies} showtimes={showtimes} combos={combos} />
      </div>
    </div>
  );
}

export function ComboPicker({
  movies,
  showtimes,
  combos,
}: {
  movies: readonly Movie[];
  showtimes: readonly Showtime[];
  combos: readonly Combo[];
}) {
  const router = useRouter();
  const quantities = useBookingStore((state) => state.comboQuantities);
  const setQuantity = useBookingStore((state) => state.setComboQuantity);
  return (
    <div>
      <BookingSteps active={3} />
      <div className="booking-content-grid grid gap-6">
        <section className="grid gap-4 sm:grid-cols-2">
          {combos.map((combo) => (
            <article
              key={combo.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-raised">
                <Image
                  alt=""
                  fill
                  src={combo.imagePath ?? ""}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold">{combo.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {combo.description}
                  </p>
                </div>
                {combo.badge && <Badge>{combo.badge}</Badge>}
              </div>
              <p className="mt-3 font-semibold">
                {money.format(combo.unitPrice)}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Giảm ${combo.name}`}
                  onClick={() =>
                    setQuantity(combo.id, (quantities[combo.id] ?? 0) - 1)
                  }
                >
                  <MinusIcon />
                </Button>
                <span className="min-w-6 text-center">
                  {quantities[combo.id] ?? 0}
                </span>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Tăng ${combo.name}`}
                  onClick={() =>
                    setQuantity(combo.id, (quantities[combo.id] ?? 0) + 1)
                  }
                >
                  <PlusIcon />
                </Button>
              </div>
            </article>
          ))}
        </section>
        <div className="grid content-start gap-4">
          <BookingSummary
            movies={movies}
            showtimes={showtimes}
            combos={combos}
          />
          <Button
            disabled={!useBookingStore.getState().seatIds.length}
            onClick={() => router.push("/booking/checkout")}
          >
            Tiếp tục thanh toán
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/booking/checkout")}
          >
            Bỏ qua combo
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Checkout({
  movies,
  showtimes,
  combos,
}: {
  movies: readonly Movie[];
  showtimes: readonly Showtime[];
  combos: readonly Combo[];
}) {
  const router = useRouter();
  const draft = useBookingStore((state) => state);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState<"card" | "momo">("card");
  const ticketTotal = useMemo(
    () =>
      draft.seatIds.reduce(
        (total, id) =>
          total +
          95000 *
          (seatPlan.find((seat) => seat.id === id)?.priceMultiplier ?? 1),
        0,
      ) +
      combos.reduce(
        (total, combo) =>
          total + combo.unitPrice * (draft.comboQuantities[combo.id] ?? 0),
        0,
      ) +
      draft.seatIds.length * 5000,
    [combos, draft.comboQuantities, draft.seatIds],
  );
  if (!draft.showtimeId || !draft.seatIds.length)
    return (
      <section className="rounded-xl border border-destructive bg-surface p-6">
        <h2 className="font-bold">Chưa đủ thông tin đặt vé</h2>
        <p className="mt-2 text-muted-foreground">
          Hãy chọn suất chiếu và ít nhất một ghế trước khi thanh toán.
        </p>
        <Link
          className="mt-4 inline-block text-primary-bright"
          href="/showtimes"
        >
          Quay lại chọn suất chiếu
        </Link>
      </section>
    );
  const canPay = Boolean(
    name.trim() &&
    email.trim() &&
    draft.acceptedTerms &&
    draft.confirmedAgeEligibility,
  );
  return (
    <div>
      <BookingSteps active={4} />
      <div className="booking-content-grid grid gap-6">
        <form
          className="grid gap-5 rounded-xl border border-border bg-surface p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canPay) return;
            const selectedMovie = movies.find(
              (movie) => movie.id === draft.movieId,
            );
            const ticket: Ticket = {
              id: crypto.randomUUID(),
              code: `CV-${Date.now().toString().slice(-8)}`,
              movieTitle: selectedMovie?.title ?? "Cineverse",
              showtimeId: draft.showtimeId!,
              seatLabels: draft.seatIds.map(
                (id) => seatPlan.find((seat) => seat.id === id)?.label ?? id,
              ),
              comboQuantities: draft.comboQuantities,
              total: ticketTotal,
              customerName: name,
              customerEmail: email,
              createdAt: new Date().toISOString(),
              status: "valid",
            };
            draft.issueTicket(ticket);
            draft.clearBooking();
            router.push(`/ticket/${ticket.id}`);
          }}
        >
          <h2 className="text-xl font-bold">Thông tin liên hệ</h2>
          <Input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Họ và tên"
          />
          <Input
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email nhận vé"
          />
          <fieldset className="grid gap-3">
            <legend className="font-semibold">Phương thức thanh toán</legend>
            <label className="rounded-lg border border-border p-3">
              <input
                checked={payment === "card"}
                onChange={() => setPayment("card")}
                name="payment"
                type="radio"
              />{" "}
              Thẻ ngân hàng
            </label>
            <label className="rounded-lg border border-border p-3">
              <input
                checked={payment === "momo"}
                onChange={() => setPayment("momo")}
                name="payment"
                type="radio"
              />{" "}
              Ví MoMo (mock QR)
            </label>
            {payment === "card" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Số thẻ" inputMode="numeric" required />
                <Input placeholder="MM/YY" required />
              </div>
            ) : (
              <div className="rounded-lg bg-surface-raised p-4 text-sm">
                Mã QR MoMo mock sẽ được xác nhận khi bạn phát hành vé.
              </div>
            )}
          </fieldset>
          <label className="flex gap-2 text-sm">
            <input
              checked={draft.confirmedAgeEligibility}
              onChange={(event) =>
                draft.setCheckoutConfirmation(
                  "confirmedAgeEligibility",
                  event.target.checked,
                )
              }
              type="checkbox"
            />{" "}
            Tôi xác nhận điều kiện phân loại độ tuổi.
          </label>
          <label className="flex gap-2 text-sm">
            <input
              checked={draft.acceptedTerms}
              onChange={(event) =>
                draft.setCheckoutConfirmation(
                  "acceptedTerms",
                  event.target.checked,
                )
              }
              type="checkbox"
            />{" "}
            Tôi đồng ý điều khoản sử dụng và chính sách bảo mật.
          </label>
          <Button disabled={!canPay} type="submit">
            Xác nhận thanh toán {money.format(ticketTotal)}
          </Button>
        </form>
        <BookingSummary movies={movies} showtimes={showtimes} combos={combos} />
      </div>
    </div>
  );
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-surface p-6",
        "print:border-black print:bg-white print:text-black",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-primary-bright">
            CINEVERSE E-TICKET
          </p>
          <h1 className="mt-2 text-2xl font-black">{ticket.movieTitle}</h1>
          <p className="mt-2 text-muted-foreground">
            Mã vé: <strong className="text-foreground">{ticket.code}</strong>
          </p>
        </div>
        <div
          aria-label={`QR code ${ticket.code}`}
          className="grid size-32 grid-cols-8 gap-px bg-white p-2"
        >
          {Array.from({ length: 64 }, (_, index) => (
            <i
              key={index}
              className={
                (index * 7 + ticket.code.length * 3) % 5 < 2
                  ? "bg-black"
                  : "bg-white"
              }
            />
          ))}
        </div>
      </div>
      <dl className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Ghế</dt>
          <dd>{ticket.seatLabels.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Thanh toán</dt>
          <dd>{money.format(ticket.total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Trạng thái</dt>
          <dd>
            <Badge
              variant={ticket.status === "valid" ? "default" : "secondary"}
            >
              {ticket.status === "valid" ? "Hợp lệ" : "Đã sử dụng"}
            </Badge>
          </dd>
        </div>
      </dl>
      <Button
        className="mt-6 print:hidden"
        variant="outline"
        onClick={() => window.print()}
      >
        <PrinterIcon data-icon="inline-start" />
        In vé
      </Button>
    </article>
  );
}

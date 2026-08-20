"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CakeIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  TicketIcon,
} from "lucide-react";
import {
  AgeRestrictionModal,
  ageRestrictionPolicies,
  ratingAliases,
} from "@/components/booking/age-restriction-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { distanceInKm, formatDistance } from "@/lib/geo";
import {
  buildShowtimesFor,
  resolveShowtimeById,
  showtimeEndLabel,
  showtimeGroupLabel,
  showtimeStartLabel,
} from "@/lib/showtime-schedule";
import { useViewerLocation } from "@/lib/use-viewer-location";
import { useBookingStore } from "@/lib/stores/booking.store";
import type {
  Cinema,
  CinemaBrand,
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

export function BookingSteps({ active }: { active: number }) {
  return (
    <ol className="mb-8 grid grid-cols-5 gap-2 text-center text-xs text-muted-foreground">
      {["Suất chiếu", "Ghế ngồi", "Combo", "Thanh toán", "Mã vé"].map(
        (label, index) => (
          <li
            key={label}
            className={
              index + 1 < active
                ? "text-cv-success"
                : index + 1 === active
                  ? "text-cv-primary-bright"
                  : ""
            }
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
  cinemas,
  combos,
  action,
}: {
  movies: readonly Movie[];
  cinemas: readonly Cinema[];
  combos: readonly Combo[];
  action?: ReactNode;
}) {
  const draft = useBookingStore((state) => state);
  const movie = movies.find((item) => item.id === draft.movieId);
  const showtime = resolveShowtimeById(draft.showtimeId, cinemas);

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
          <span>{money.format(seatTotal + comboTotal)}</span>
        </div>

        {action}
      </div>
    </aside>
  );
}

function ShowtimeSelectionSummary({
  movie,
  ratingLabel,
  dayLabel,
  cinemaLabel,
  showtimeLabel,
  canContinue,
  onContinue,
}: {
  movie: Movie | undefined;
  ratingLabel: string;
  dayLabel: string;
  cinemaLabel: string;
  showtimeLabel: string;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const normalizedRating = ratingAliases[ratingLabel] ?? ratingLabel;
  const policy =
    ageRestrictionPolicies[normalizedRating] ?? ageRestrictionPolicies.P;

  return (
    <aside className="booking-summary-panel rounded-xl border border-border bg-surface p-5 shadow-cinema">
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cv-primary-bright/10 text-cv-primary-bright">
          <TicketIcon className="size-4.5" />
        </span>
        <div className="grid gap-0.5">
          <p className="text-[.63rem] font-extrabold tracking-[.11em] text-muted-foreground uppercase">
            Lựa chọn hiện tại
          </p>
          <p className="font-bold leading-tight">
            {movie?.title ?? "Chọn phim"}
          </p>
        </div>
      </div>

      <dl className="my-3.5 grid">
        {[
          { label: "Phân loại", value: null },
          { label: "Ngày", value: dayLabel },
          { label: "Rạp", value: cinemaLabel },
          { label: "Suất chiếu", value: showtimeLabel },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 py-1.5"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="m-0 max-w-[60%] text-right text-sm font-bold">
              {row.value === null ? (
                <Badge variant="outline" className="uppercase">
                  {policy.code}
                </Badge>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="my-3.5 flex items-start gap-2.5 rounded-[10px] border border-cv-primary-bright/20 bg-primary/6 p-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-cv-primary-bright/10 text-cv-primary-bright">
          <CakeIcon className="size-4.25" />
        </span>
        <div className="grid gap-1">
          <p className="text-[.71rem] leading-snug text-muted-foreground">
            {policy.description}
          </p>
          <p className="text-[.71rem] font-bold text-cv-warning italic">
            Điều kiện độ tuổi sẽ được kiểm tra trước khi thanh toán.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="summary-cta-button"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Chọn ghế
        <ArrowRightIcon />
      </button>
    </aside>
  );
}

/** `2026-08-20` → Date lúc 00:00 giờ Việt Nam. */
function parseBookingDate(date: string): Date {
  return new Date(`${date}T00:00:00+07:00`);
}

const weekdayShort = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

const fullDate = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

function CinemaShowtimes({
  cinema,
  brand,
  distanceKm,
  movie,
  date,
  pendingShowtime,
  onSelect,
}: {
  cinema: Cinema;
  brand: CinemaBrand | undefined;
  distanceKm: number;
  movie: Movie | undefined;
  date: string;
  pendingShowtime: Showtime | null;
  onSelect: (showtime: Showtime) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const groups = useMemo(() => {
    if (!movie) {
      return [];
    }

    const byLabel = new Map<string, Showtime[]>();

    for (const showtime of buildShowtimesFor(movie.id, cinema, date)) {
      const label = showtimeGroupLabel(showtime);
      const bucket = byLabel.get(label);

      if (bucket) {
        bucket.push(showtime);
      } else {
        byLabel.set(label, [showtime]);
      }
    }

    return [...byLabel.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [cinema, date, movie]);

  return (
    <article
      className={cn(
        "cinema-card",
        pendingShowtime?.cinemaId === cinema.id && "is-selected",
      )}
    >
      <button
        type="button"
        className="cinema-head"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="cinema-identity">
          {brand && (
            <span className="cinema-brand-logo">
              <Image
                alt={brand.name}
                src={brand.logoPath}
                width={52}
                height={52}
                loading="eager"
                unoptimized
              />
            </span>
          )}
          <span>
            <h3>{cinema.name}</h3>
            <span className="cinema-address">
              <MapPinIcon />
              {cinema.address} · {formatDistance(distanceKm)}
            </span>
          </span>
        </span>
        <span className="cinema-toggle" aria-hidden>
          <ChevronRightIcon />
        </span>
      </button>

      <div className="showtime-groups" hidden={!isOpen}>
        {groups.map(([label, items]) => (
          <div key={label}>
            <p className="showtime-group-label">{label}</p>
            <div className="showtime-grid">
              {items.map((showtime) => (
                <button
                  key={showtime.id}
                  type="button"
                  className={cn(
                    "showtime-chip",
                    pendingShowtime?.id === showtime.id && "is-active",
                  )}
                  onClick={() => onSelect(showtime)}
                >
                  <strong>{showtimeStartLabel(showtime)}</strong>
                  <span>
                    ~ {showtimeEndLabel(showtime, movie?.durationMinutes ?? 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && (
          <p className="text-sm text-muted-foreground">Chưa có suất phù hợp.</p>
        )}
      </div>
    </article>
  );
}

export function ShowtimePicker({
  movie,
  brands,
  cinemas,
  dates,
}: {
  movie: Movie;
  brands: readonly CinemaBrand[];
  cinemas: readonly Cinema[];
  dates: readonly string[];
}) {
  const router = useRouter();
  const cities = useMemo(
    () => [...new Set(cinemas.map((cinema) => cinema.cityName))],
    [cinemas],
  );
  const [city, setCity] = useState(cities[0]);
  const [date, setDate] = useState(dates[0]);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [pendingShowtime, setPendingShowtime] = useState<Showtime | null>(null);
  const [ageModalOpen, setAgeModalOpen] = useState(false);
  const selectMovie = useBookingStore((state) => state.selectMovie);
  const selectShowtime = useBookingStore((state) => state.selectShowtime);
  const { coordinates } = useViewerLocation();
  const selectedCinema = pendingShowtime
    ? cinemas.find((cinema) => cinema.id === pendingShowtime.cinemaId)
    : null;

  /** Rạp trong thành phố đang chọn, rạp gần khách nhất xếp lên đầu. */
  const rankedCinemas = useMemo(
    () =>
      cinemas
        .filter((cinema) => cinema.cityName === city)
        .map((cinema) => ({
          cinema,
          distanceKm: distanceInKm(coordinates, cinema),
        }))
        .sort((left, right) => left.distanceKm - right.distanceKm),
    [cinemas, city, coordinates],
  );

  /** Chỉ hiện thương hiệu thật sự có rạp trong thành phố đang chọn. */
  const cityBrands = brands.filter((brand) =>
    rankedCinemas.some((entry) => entry.cinema.brandId === brand.id),
  );

  const visibleCinemas = brandId
    ? rankedCinemas.filter((entry) => entry.cinema.brandId === brandId)
    : rankedCinemas;

  return (
    <div>
      <BookingSteps active={1} />
      <div className="booking-content-grid grid gap-6">
        <section className="booking-panel-stack rounded-xl border border-border bg-surface p-5">
          <div>
            <div className="booking-city-bar">
              <div className="filter-select-wrap">
                <select
                  aria-label="Lọc rạp theo thành phố"
                  className="filter-select"
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                    setBrandId(null);
                    setPendingShowtime(null);
                  }}
                >
                  {cities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <span aria-hidden className="filter-select-icon">
                  <ChevronDownIcon className="size-full" strokeWidth={2.35} />
                </span>
              </div>
            </div>
            <div className="date-picker">
              {dates.map((value) => {
                const parsed = parseBookingDate(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={cn("date-chip", value === date && "is-active")}
                    onClick={() => {
                      setDate(value);
                      setPendingShowtime(null);
                    }}
                  >
                    <small>{weekdayShort.format(parsed)}</small>
                    <strong>{value.slice(8, 10)}</strong>
                    <span>Tháng {value.slice(5, 7)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="brand-picker">
            <button
              type="button"
              className={cn("brand-tile", brandId === null && "is-active")}
              onClick={() => {
                setBrandId(null);
                setPendingShowtime(null);
              }}
            >
              <span className="brand-tile-all">
                <LayoutGridIcon />
              </span>
              <span className="brand-tile-name">Tất cả</span>
            </button>
            {cityBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                className={cn(
                  "brand-tile",
                  brandId === brand.id && "is-active",
                )}
                onClick={() => {
                  setBrandId(brand.id);
                  setPendingShowtime(null);
                }}
              >
                <span className="brand-tile-logo">
                  <Image
                    alt={brand.name}
                    src={brand.logoPath}
                    width={68}
                    height={68}
                    loading="eager"
                    unoptimized
                  />
                </span>
                <span className="brand-tile-name">{brand.shortName}</span>
              </button>
            ))}
          </div>

          <div className="cinema-list">
            {visibleCinemas.map((entry) => (
              <CinemaShowtimes
                key={entry.cinema.id}
                cinema={entry.cinema}
                brand={brands.find((item) => item.id === entry.cinema.brandId)}
                distanceKm={entry.distanceKm}
                movie={movie}
                date={date}
                pendingShowtime={pendingShowtime}
                onSelect={setPendingShowtime}
              />
            ))}
          </div>
        </section>
        <ShowtimeSelectionSummary
          movie={movie}
          ratingLabel={movie.ratingLabel}
          dayLabel={fullDate.format(parseBookingDate(date))}
          cinemaLabel={selectedCinema?.name ?? "Chưa chọn"}
          showtimeLabel={
            pendingShowtime
              ? `${showtimeStartLabel(pendingShowtime)} · ${showtimeGroupLabel(pendingShowtime)}`
              : "Chưa chọn"
          }
          canContinue={pendingShowtime !== null}
          onContinue={() => setAgeModalOpen(true)}
        />
      </div>
      <AgeRestrictionModal
        open={ageModalOpen}
        rating={movie.ratingLabel}
        onCancel={() => setAgeModalOpen(false)}
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
  cinemas,
  combos,
}: {
  movies: readonly Movie[];
  cinemas: readonly Cinema[];
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
        <BookingSummary movies={movies} cinemas={cinemas} combos={combos} />
      </div>
    </div>
  );
}

function ComboSelectionSummary({
  combos,
  onContinue,
}: {
  combos: readonly Combo[];
  onContinue: () => void;
}) {
  const seatIds = useBookingStore((state) => state.seatIds);
  const comboQuantities = useBookingStore((state) => state.comboQuantities);

  const seatSubtotal = seatIds.reduce(
    (total, id) =>
      total +
      95000 * (seatPlan.find((seat) => seat.id === id)?.priceMultiplier ?? 1),
    0,
  );

  const comboLines = combos
    .map((combo) => ({ combo, quantity: comboQuantities[combo.id] ?? 0 }))
    .filter((line) => line.quantity > 0);

  const comboSubtotal = comboLines.reduce(
    (total, line) => total + line.combo.unitPrice * line.quantity,
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
            Đơn hàng
          </p>
          <p className="font-bold leading-tight">
            {seatIds.length} ghế đã chọn
          </p>
        </div>
      </div>

      <dl className="summary-list">
        <div>
          <dt>Tiền vé</dt>
          <dd>{money.format(seatSubtotal)}</dd>
        </div>
        <div>
          <dt>Combo</dt>
          <dd>{money.format(comboSubtotal)}</dd>
        </div>
        <div className="summary-total">
          <dt>Tổng cộng</dt>
          <dd>{money.format(seatSubtotal + comboSubtotal)}</dd>
        </div>
      </dl>

      {comboLines.length ? (
        <div className="summary-combos">
          {comboLines.map((line) => (
            <p key={line.combo.id}>
              <span>
                {line.quantity} × {line.combo.name}
              </span>
              <b>{money.format(line.combo.unitPrice * line.quantity)}</b>
            </p>
          ))}
        </div>
      ) : (
        <p className="summary-empty">
          Bạn có thể bỏ qua combo và tiếp tục thanh toán.
        </p>
      )}

      <button
        type="button"
        className="summary-cta-button"
        disabled={!seatIds.length}
        onClick={onContinue}
      >
        Tiếp tục thanh toán
        <ArrowRightIcon />
      </button>
    </aside>
  );
}

export function ComboPicker({
  combos,
}: {
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
        <ComboSelectionSummary
          combos={combos}
          onContinue={() => router.push("/booking/checkout")}
        />
      </div>
    </div>
  );
}

export function Checkout({
  movies,
  cinemas,
  combos,
}: {
  movies: readonly Movie[];
  cinemas: readonly Cinema[];
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
      ),
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
        <BookingSummary movies={movies} cinemas={cinemas} combos={combos} />
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  LockKeyholeIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserRoundIcon,
} from "lucide-react";
import { BookingSteps } from "@/components/booking/booking-flow";
import { ShowtimeSummaryCard } from "@/components/booking/showtime-summary-card";
import { AppModal } from "@/components/feedback/app-modal";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resolveShowtimeById,
  showtimeEndLabel,
  showtimeGroupLabel,
  showtimeStartLabel,
} from "@/lib/showtime-schedule";
import { useBookingStore } from "@/lib/stores/booking.store";
import { cn } from "@/lib/utils";
import type { Cinema, Combo, Movie, Ticket } from "@/types/domain";

type PaymentMethod = "card" | "momo";

interface CheckoutValues {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly cardNumber: string;
  readonly expiry: string;
  readonly cvv: string;
  readonly momoPhone: string;
}

type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>> & {
  terms?: string;
  age?: string;
};

interface CheckoutFormProps {
  readonly movies: readonly Movie[];
  readonly cinemas: readonly Cinema[];
  readonly combos: readonly Combo[];
}

const initialCheckoutValues: CheckoutValues = {
  fullName: "",
  email: "",
  phone: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  momoPhone: "",
};

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Phí dịch vụ tính trên mỗi vé — giống bảng giá của frontend legacy. */
const serviceFeePerSeat = 5000;

const checkoutDate = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vietnamesePhonePattern = /^(0|\+84)[0-9]{9,10}$/;

function getSeatPrice(seatId: string) {
  if (seatId.startsWith("J")) {
    return 190000;
  }

  if (["G", "H", "I"].includes(seatId.charAt(0))) {
    return 125400;
  }

  return 95000;
}

function getAdmissionCount(seatIds: readonly string[]) {
  return seatIds.reduce(
    (total, seatId) => total + (seatId.startsWith("J") ? 2 : 1),
    0,
  );
}

function validateCheckout(
  values: CheckoutValues,
  paymentMethod: PaymentMethod,
  acceptedTerms: boolean,
  confirmedAgeEligibility: boolean,
): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Vui lòng nhập họ và tên hợp lệ.";
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  }

  if (!vietnamesePhonePattern.test(values.phone.replace(/\s/g, ""))) {
    errors.phone = "Vui lòng nhập số điện thoại Việt Nam hợp lệ.";
  }

  if (paymentMethod === "card") {
    if (!/^\d{16}$/.test(values.cardNumber.replace(/\s/g, ""))) {
      errors.cardNumber = "Số thẻ cần gồm 16 chữ số.";
    }

    if (!/^\d{2}\/\d{2}$/.test(values.expiry)) {
      errors.expiry = "Nhập ngày hết hạn theo định dạng MM/YY.";
    }

    if (!/^\d{3,4}$/.test(values.cvv)) {
      errors.cvv = "Mã CVV cần gồm 3 hoặc 4 chữ số.";
    }
  } else if (
    !vietnamesePhonePattern.test(values.momoPhone.replace(/\s/g, ""))
  ) {
    errors.momoPhone = "Vui lòng nhập số điện thoại đăng ký MoMo hợp lệ.";
  }

  if (!confirmedAgeEligibility) {
    errors.age = "Bạn cần xác nhận điều kiện phân loại độ tuổi.";
  }

  if (!acceptedTerms) {
    errors.terms = "Bạn cần đồng ý với điều khoản để thanh toán.";
  }

  return errors;
}

function FieldError({ message }: { readonly message?: string }) {
  if (!message) {
    return null;
  }

  return <small className="form-field-error">{message}</small>;
}

export function CheckoutForm({ movies, cinemas, combos }: CheckoutFormProps) {
  const router = useRouter();
  const { notify } = useFeedback();
  const booking = useBookingStore((state) => state);
  const [values, setValues] = useState<CheckoutValues>(initialCheckoutValues);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [isMomoModalOpen, setIsMomoModalOpen] = useState(false);
  const [isConfirmingMomo, setIsConfirmingMomo] = useState(false);

  const selectedMovie = movies.find((movie) => movie.id === booking.movieId);
  const selectedShowtime =
    resolveShowtimeById(booking.showtimeId, cinemas) ?? undefined;
  const selectedCinema = cinemas.find(
    (cinema) => cinema.id === selectedShowtime?.cinemaId,
  );
  const showtimeSummary = useMemo(() => {
    if (!selectedShowtime || !selectedMovie || !selectedCinema) {
      return null;
    }

    return {
      movieTitle: selectedMovie.title,
      posterPath: selectedMovie.posterPath,
      cinemaName: selectedCinema.name,
      hall: `Phòng chiếu ${selectedShowtime.hall}`,
      dateLabel: checkoutDate.format(new Date(selectedShowtime.startsAt)),
      timeLabel: `${showtimeStartLabel(selectedShowtime)} ~ ${showtimeEndLabel(selectedShowtime, selectedMovie.durationMinutes)}`,
      formatLabel: showtimeGroupLabel(selectedShowtime),
    };
  }, [selectedCinema, selectedMovie, selectedShowtime]);
  const seatSubtotal = useMemo(
    () =>
      booking.seatIds.reduce(
        (total, seatId) => total + getSeatPrice(seatId),
        0,
      ),
    [booking.seatIds],
  );
  const comboSubtotal = useMemo(
    () =>
      combos.reduce(
        (total, combo) =>
          total + combo.unitPrice * (booking.comboQuantities[combo.id] ?? 0),
        0,
      ),
    [booking.comboQuantities, combos],
  );
  const serviceFee = getAdmissionCount(booking.seatIds) * serviceFeePerSeat;
  const voucherDiscount = voucherApplied ? Math.min(seatSubtotal, 20000) : 0;
  const orderTotal =
    seatSubtotal + comboSubtotal + serviceFee - voucherDiscount;

  const setField = (field: keyof CheckoutValues) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      let nextValue = event.target.value;

      if (field === "cardNumber") {
        nextValue = nextValue.replace(/\D/g, "").slice(0, 16);
      }

      if (field === "expiry") {
        const numbers = nextValue.replace(/\D/g, "").slice(0, 4);
        nextValue =
          numbers.length > 2
            ? `${numbers.slice(0, 2)}/${numbers.slice(2)}`
            : numbers;
      }

      if (field === "cvv") {
        nextValue = nextValue.replace(/\D/g, "").slice(0, 4);
      }

      setValues((currentValues) => ({
        ...currentValues,
        [field]: nextValue,
      }));
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    };
  };

  const applyVoucher = () => {
    if (voucherCode.trim().toUpperCase() !== "CINE20") {
      setVoucherApplied(false);
      notify(
        "Mã voucher không hợp lệ. Hãy thử CINE20 trong mock flow.",
        "error",
      );
      return;
    }

    setVoucherApplied(true);
    notify("Đã áp dụng voucher CINE20: giảm tối đa 20.000 ₫.", "success");
  };

  const issueTicket = () => {
    if (!booking.showtimeId || !booking.seatIds.length) {
      return;
    }

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code: `CV-${Date.now().toString().slice(-8)}`,
      movieTitle: selectedMovie?.title ?? "CINEVERSE",
      showtimeId: booking.showtimeId,
      seatLabels: booking.seatIds,
      comboQuantities: booking.comboQuantities,
      total: orderTotal,
      customerName: values.fullName.trim(),
      customerEmail: values.email.trim(),
      createdAt: new Date().toISOString(),
      status: "valid",
    };

    booking.issueTicket(ticket);
    booking.clearBooking();
    notify("Thanh toán thành công. Vé điện tử đã được phát hành.", "success");
    router.push(`/ticket/${ticket.id}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCheckout(
      values,
      paymentMethod,
      booking.acceptedTerms,
      booking.confirmedAgeEligibility,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      notify("Vui lòng kiểm tra lại thông tin thanh toán.", "error");
      return;
    }

    if (paymentMethod === "momo") {
      setIsMomoModalOpen(true);
      return;
    }

    issueTicket();
  };

  if (!booking.showtimeId || booking.seatIds.length === 0) {
    return (
      <section className="checkout-empty-state">
        <TicketIcon aria-hidden="true" className="size-8 text-destructive" />
        <h2>Chưa đủ thông tin đặt vé</h2>
        <p>Hãy chọn suất chiếu và ít nhất một ghế trước khi thanh toán.</p>
        <Link href="/showtimes">Quay lại chọn suất chiếu</Link>
      </section>
    );
  }

  return (
    <div>
      <BookingSteps active={4} />
      <Link className="home-text-link text-link-back" href="/booking/combos">
        <ArrowLeftIcon aria-hidden="true" />
        Quay lại
      </Link>
      {showtimeSummary && (
        <div className="seat-context">
          <ShowtimeSummaryCard summary={showtimeSummary} />
        </div>
      )}
      <div className="checkout-grid">
        <form className="checkout-form-card" onSubmit={handleSubmit} noValidate>
          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <span>
                <UserRoundIcon aria-hidden="true" />
              </span>
              <div>
                <h2>Thông tin liên hệ</h2>
                <p>Vé điện tử sẽ được gửi đến email của bạn.</p>
              </div>
            </div>
            <div className="checkout-form-grid">
              <label className="form-field form-field-wide">
                <span>Họ và tên</span>
                <Input
                  aria-invalid={Boolean(errors.fullName) || undefined}
                  autoComplete="name"
                  onChange={setField("fullName")}
                  placeholder="Nguyễn Văn An"
                  value={values.fullName}
                />
                <FieldError message={errors.fullName} />
              </label>
              <label className="form-field">
                <span>Email nhận vé</span>
                <Input
                  aria-invalid={Boolean(errors.email) || undefined}
                  autoComplete="email"
                  onChange={setField("email")}
                  placeholder="an@example.com"
                  type="email"
                  value={values.email}
                />
                <FieldError message={errors.email} />
              </label>
              <label className="form-field">
                <span>Số điện thoại</span>
                <Input
                  aria-invalid={Boolean(errors.phone) || undefined}
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={setField("phone")}
                  placeholder="0912345678"
                  type="tel"
                  value={values.phone}
                />
                <FieldError message={errors.phone} />
              </label>
            </div>
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <span>
                <TicketIcon aria-hidden="true" />
              </span>
              <div>
                <h2>Voucher ưu đãi</h2>
                <p>Nhập mã khuyến mãi để cập nhật tổng thanh toán ngay.</p>
              </div>
            </div>
            <div className="voucher-input-row">
              <Input
                onChange={(event) => {
                  setVoucherCode(event.target.value.toUpperCase());
                  setVoucherApplied(false);
                }}
                placeholder="Nhập mã voucher"
                value={voucherCode}
              />
              <Button onClick={applyVoucher} type="button" variant="outline">
                Áp dụng
              </Button>
            </div>
            <p
              className={
                voucherApplied ? "voucher-status is-applied" : "voucher-status"
              }
            >
              {voucherApplied
                ? "Voucher CINE20 đang được áp dụng."
                : "Mock voucher: CINE20 giảm tối đa 20.000 ₫."}
            </p>
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <span>
                <ShieldCheckIcon aria-hidden="true" />
              </span>
              <div>
                <h2>Phương thức thanh toán</h2>
                <p>Chọn thẻ nội địa hoặc xác nhận giao dịch qua MoMo.</p>
              </div>
            </div>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  checked={paymentMethod === "card"}
                  name="paymentMethod"
                  onChange={() => setPaymentMethod("card")}
                  type="radio"
                />
                <span>
                  <CreditCardIcon aria-hidden="true" />
                  <span>
                    <strong>Thẻ ngân hàng</strong>
                    <small>Visa, Mastercard và thẻ nội địa</small>
                  </span>
                </span>
              </label>
              <label className="payment-option">
                <input
                  checked={paymentMethod === "momo"}
                  name="paymentMethod"
                  onChange={() => setPaymentMethod("momo")}
                  type="radio"
                />
                <span>
                  <QrCodeIcon aria-hidden="true" />
                  <span>
                    <strong>Ví MoMo</strong>
                    <small>
                      Quét QR hoặc xác nhận giao dịch trong ứng dụng
                    </small>
                  </span>
                </span>
              </label>
            </div>
            {paymentMethod === "card" ? (
              <div className="payment-panel checkout-form-grid">
                <label className="form-field form-field-wide">
                  <span>Số thẻ</span>
                  <Input
                    aria-invalid={Boolean(errors.cardNumber) || undefined}
                    inputMode="numeric"
                    onChange={setField("cardNumber")}
                    placeholder="0000 0000 0000 0000"
                    value={values.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
                  />
                  <FieldError message={errors.cardNumber} />
                </label>
                <label className="form-field">
                  <span>Ngày hết hạn</span>
                  <Input
                    aria-invalid={Boolean(errors.expiry) || undefined}
                    inputMode="numeric"
                    onChange={setField("expiry")}
                    placeholder="MM/YY"
                    value={values.expiry}
                  />
                  <FieldError message={errors.expiry} />
                </label>
                <label className="form-field">
                  <span>CVV</span>
                  <Input
                    aria-invalid={Boolean(errors.cvv) || undefined}
                    inputMode="numeric"
                    onChange={setField("cvv")}
                    placeholder="•••"
                    type="password"
                    value={values.cvv}
                  />
                  <FieldError message={errors.cvv} />
                </label>
              </div>
            ) : (
              <div className="payment-panel momo-panel">
                <Image
                  alt="MoMo"
                  className="momo-brand-image"
                  height={52}
                  src="/assets/momo/momo.png"
                  width={52}
                />
                <div>
                  <strong>Thanh toán trực tuyến qua MoMo</strong>
                  <p>Một cửa sổ xác nhận QR sẽ mở trước khi phát hành vé.</p>
                  <b>{money.format(orderTotal)}</b>
                </div>
                <label className="form-field form-field-wide">
                  <span>Số điện thoại đăng ký MoMo</span>
                  <Input
                    aria-invalid={Boolean(errors.momoPhone) || undefined}
                    autoComplete="tel"
                    inputMode="tel"
                    onChange={setField("momoPhone")}
                    placeholder="0912345678"
                    type="tel"
                    value={values.momoPhone}
                  />
                  <FieldError message={errors.momoPhone} />
                </label>
              </div>
            )}
          </section>

          <label className={cn("terms-check", errors.age && "has-error")}>
            <input
              checked={booking.confirmedAgeEligibility}
              onChange={(event) => {
                booking.setCheckoutConfirmation(
                  "confirmedAgeEligibility",
                  event.target.checked,
                );
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  age: undefined,
                }));
              }}
              type="checkbox"
            />
            <span>
              Tôi xác nhận thông tin cá nhân và điều kiện phân loại độ tuổi của
              đơn hàng là chính xác.
            </span>
          </label>
          <FieldError message={errors.age} />
          <label className={cn("terms-check", errors.terms && "has-error")}>
            <input
              checked={booking.acceptedTerms}
              onChange={(event) => {
                booking.setCheckoutConfirmation(
                  "acceptedTerms",
                  event.target.checked,
                );
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  terms: undefined,
                }));
              }}
              type="checkbox"
            />
            <span>
              Tôi đồng ý với Điều khoản sử dụng, Chính sách bảo mật và chính
              sách kiểm soát vé của CINEVERSE.
            </span>
          </label>
          <FieldError message={errors.terms} />
          <Button className="checkout-submit" type="submit">
            Xác nhận thanh toán · {money.format(orderTotal)}
          </Button>
          <p className="secure-note">
            <LockKeyholeIcon aria-hidden="true" className="size-4" />
            Thông tin thanh toán mock không được lưu trữ.
          </p>
        </form>
        <CheckoutOrderSummary
          comboSubtotal={comboSubtotal}
          combos={combos}
          comboQuantities={booking.comboQuantities}
          seatIds={booking.seatIds}
          serviceFee={serviceFee}
          seatSubtotal={seatSubtotal}
          total={orderTotal}
          voucherDiscount={voucherDiscount}
        />
      </div>
      <AppModal
        description="Mở ứng dụng MoMo và xác nhận yêu cầu thanh toán cho đơn hàng CINEVERSE."
        footer={
          <>
            <Button
              disabled={isConfirmingMomo}
              onClick={() => setIsMomoModalOpen(false)}
              variant="outline"
            >
              Hủy giao dịch
            </Button>
            <Button
              className="momo-confirm-button"
              disabled={isConfirmingMomo}
              onClick={() => {
                setIsConfirmingMomo(true);
                window.setTimeout(() => issueTicket(), 650);
              }}
            >
              {isConfirmingMomo ? "Đang xác nhận" : "Xác nhận thanh toán MoMo"}
            </Button>
          </>
        }
        onOpenChange={(open) => {
          if (!isConfirmingMomo) {
            setIsMomoModalOpen(open);
          }
        }}
        open={isMomoModalOpen}
        title="Xác nhận thanh toán MoMo"
      >
        <div className="momo-modal-body">
          <Image
            alt="Mã QR dẫn đến trang MoMo Developers"
            className="momo-qr-image"
            height={150}
            src="/assets/momo/momo-developers-qr.png"
            width={150}
          />
          <dl className="momo-modal-summary">
            <div>
              <dt>Số tiền</dt>
              <dd>{money.format(orderTotal)}</dd>
            </div>
            <div>
              <dt>Số điện thoại</dt>
              <dd>{values.momoPhone}</dd>
            </div>
            <div>
              <dt>Mã giao dịch</dt>
              <dd>CV-MOMO-MOCK</dd>
            </div>
          </dl>
        </div>
      </AppModal>
    </div>
  );
}

function CheckoutOrderSummary({
  combos,
  comboQuantities,
  seatIds,
  seatSubtotal,
  comboSubtotal,
  serviceFee,
  voucherDiscount,
  total,
}: {
  readonly combos: readonly Combo[];
  readonly comboQuantities: Readonly<Record<string, number>>;
  readonly seatIds: readonly string[];
  readonly seatSubtotal: number;
  readonly comboSubtotal: number;
  readonly serviceFee: number;
  readonly voucherDiscount: number;
  readonly total: number;
}) {
  const comboLines = combos
    .map((combo) => ({ combo, quantity: comboQuantities[combo.id] ?? 0 }))
    .filter((line) => line.quantity > 0);

  return (
    <aside className="checkout-summary-panel">
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cv-primary-bright/10 text-cv-primary-bright">
          <TicketIcon aria-hidden="true" className="size-4.5" />
        </span>
        <div className="grid gap-0.5">
          <p className="text-[.63rem] font-extrabold tracking-[.11em] text-muted-foreground uppercase">
            Đơn hàng của bạn
          </p>
          <p className="font-bold leading-tight">
            {seatIds.length} ghế · {getAdmissionCount(seatIds)} vé
          </p>
        </div>
      </div>

      <div className="selected-seat-list" aria-label="Ghế đã chọn">
        {seatIds.map((seatId) => (
          <span className="selected-seat-pill" key={seatId}>
            {seatId}
          </span>
        ))}
      </div>

      <dl className="summary-list">
        <div>
          <dt>Tiền vé</dt>
          <dd>{money.format(seatSubtotal)}</dd>
        </div>
        <div>
          <dt>Combo</dt>
          {comboLines.length === 0 && <dd>{money.format(comboSubtotal)}</dd>}
        </div>
        {comboLines.map((line) => (
          <div className="summary-combo-line" key={line.combo.id}>
            <dt>
              {line.quantity} × {line.combo.name}
            </dt>
            <dd>{money.format(line.combo.unitPrice * line.quantity)}</dd>
          </div>
        ))}
        <div>
          <dt>Phí dịch vụ</dt>
          <dd>{money.format(serviceFee)}</dd>
        </div>
        {voucherDiscount > 0 && (
          <div className="summary-discount">
            <dt>Voucher CINE20</dt>
            <dd>- {money.format(voucherDiscount)}</dd>
          </div>
        )}
        <div className="summary-total">
          <dt>Tổng thanh toán</dt>
          <dd>{money.format(total)}</dd>
        </div>
      </dl>
    </aside>
  );
}

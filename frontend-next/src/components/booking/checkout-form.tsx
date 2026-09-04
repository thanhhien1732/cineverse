"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  GiftIcon,
  MailIcon,
  PhoneIcon,
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
  hasShowtimeStarted,
  resolveShowtimeById,
  showtimeEndLabel,
  showtimeGroupLabel,
  showtimeStartLabel,
} from "@/lib/showtime-schedule";
import {
  calculateAge,
  calculateRewardTotals,
  deriveMemberWallet,
  getTierForLifetimePoints,
  POINT_EARN_DIVISOR,
  POINT_VALUE,
} from "@/lib/member";
import { useNow } from "@/lib/use-now";
import { useCurrentProfile } from "@/lib/stores/auth.store";
import { useBookingStore } from "@/lib/stores/booking.store";
import { resolveRatingCode } from "@/lib/age-rating";
import { cn } from "@/lib/utils";
import type {
  Cinema,
  Combo,
  Movie,
  Ticket,
  TicketComboLine,
} from "@/types/domain";

type PaymentMethod = "card" | "vnpay" | "momo";

/** Cổng thanh toán mở modal quét QR trước khi phát hành vé. */
type PaymentGateway = Exclude<PaymentMethod, "card">;

interface GatewayProfile {
  readonly name: string;
  readonly logoPath: string;
  readonly logoWidth: number;
  readonly logoHeight: number;
  readonly qrPath: string;
  readonly qrAlt: string;
  readonly referencePrefix: string;
  readonly badgeClassName: string;
  readonly confirmClassName: string;
}

const gatewayProfiles: Readonly<Record<PaymentGateway, GatewayProfile>> = {
  vnpay: {
    name: "VNPAY",
    logoPath: "/assets/vnpay/vnpay-logo.webp",
    logoWidth: 52,
    logoHeight: 41,
    qrPath: "/assets/vnpay/vnpay-qr.png",
    qrAlt: "Mã QR thanh toán VNPAY",
    referencePrefix: "CV-VNPAY",
    badgeClassName: "gateway-brand-badge vnpay-brand-badge",
    confirmClassName: "vnpay-confirm-button",
  },
  momo: {
    name: "MoMo",
    logoPath: "/assets/momo/momo-logo.svg",
    logoWidth: 52,
    logoHeight: 52,
    qrPath: "/assets/momo/momo-qr.png",
    qrAlt: "Mã QR thanh toán MoMo",
    referencePrefix: "CV-MOMO",
    badgeClassName: "gateway-brand-badge momo-brand-badge",
    confirmClassName: "momo-confirm-button",
  },
};

const paymentLabels: Readonly<Record<PaymentMethod, string>> = {
  card: "Thẻ ngân hàng",
  vnpay: "VNPAY",
  momo: "MoMo",
};

interface CheckoutValues {
  readonly cardNumber: string;
  readonly expiry: string;
  readonly cvv: string;
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
  cardNumber: "",
  expiry: "",
  cvv: "",
};

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const checkoutDate = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** Mã vé 8 ký tự, bỏ các ký tự dễ nhầm (I, O, 0, 1) như frontend legacy. */
function generateTicketCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CV-";

  for (let index = 0; index < 8; index += 1) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return code;
}

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
  const profile = useCurrentProfile();
  const [values, setValues] = useState<CheckoutValues>(initialCheckoutValues);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [openGateway, setOpenGateway] = useState<PaymentGateway | null>(null);
  const [isConfirmingGateway, setIsConfirmingGateway] = useState(false);
  const [gatewayReference, setGatewayReference] = useState("");
  const openGatewayProfile = openGateway ? gatewayProfiles[openGateway] : null;

  const selectedMovie = movies.find((movie) => movie.id === booking.movieId);
  const selectedShowtime =
    resolveShowtimeById(booking.showtimeId, cinemas) ?? undefined;
  const selectedCinema = cinemas.find(
    (cinema) => cinema.id === selectedShowtime?.cinemaId,
  );
  const now = useNow();
  /** Không cho thanh toán một suất chiếu đã qua giờ chiếu. */
  const showtimeStarted = Boolean(
    selectedShowtime && hasShowtimeStarted(selectedShowtime, now),
  );
  const showtimeSummary = useMemo(() => {
    if (!selectedShowtime || !selectedMovie || !selectedCinema) {
      return null;
    }

    return {
      movieTitle: selectedMovie.title,
      ratingCode: resolveRatingCode(selectedMovie.ratingLabel),
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
  const voucherDiscount = voucherApplied ? Math.min(seatSubtotal, 20000) : 0;
  const wallet = useMemo(
    () =>
      deriveMemberWallet(
        booking.tickets,
        profile?.dateOfBirth ?? "",
        profile?.createdAt ?? new Date().toISOString(),
      ),
    [booking.tickets, profile?.createdAt, profile?.dateOfBirth],
  );
  const rewardTotals = useMemo(
    () =>
      calculateRewardTotals({
        productSubtotal: Math.max(
          0,
          seatSubtotal + comboSubtotal - voucherDiscount,
        ),
        wallet,
        pointsToRedeem,
      }),
    [comboSubtotal, pointsToRedeem, seatSubtotal, voucherDiscount, wallet],
  );
  const orderTotal = Math.max(
    0,
    seatSubtotal + comboSubtotal - voucherDiscount - rewardTotals.rewardDiscount,
  );

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

    const comboLines: readonly TicketComboLine[] = combos
      .map((combo) => ({
        name: combo.name,
        quantity: booking.comboQuantities[combo.id] ?? 0,
      }))
      .filter((line) => line.quantity > 0);
    const earnedPoints = Math.floor(orderTotal / POINT_EARN_DIVISOR);

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code: generateTicketCode(),
      movieTitle: selectedMovie?.title ?? "CINEVERSE",
      showtimeId: booking.showtimeId,
      seatLabels: booking.seatIds,
      comboQuantities: booking.comboQuantities,
      total: orderTotal,
      pointsRedeemed: rewardTotals.pointsRedeemed,
      customerName: profile?.fullName ?? "",
      customerEmail: profile?.email ?? "",
      createdAt: new Date().toISOString(),
      status: "valid",
      details: {
        posterPath: selectedMovie?.posterPath ?? "",
        ratingCode: selectedMovie
          ? resolveRatingCode(selectedMovie.ratingLabel)
          : "P",
        cinemaName: selectedCinema?.name ?? "CINEVERSE",
        hall: selectedShowtime?.hall ?? "",
        formatLabel: selectedShowtime
          ? showtimeGroupLabel(selectedShowtime)
          : "",
        startsAt: selectedShowtime?.startsAt ?? "",
        durationMinutes: selectedMovie?.durationMinutes ?? 0,
        dateLabel: selectedShowtime
          ? checkoutDate.format(new Date(selectedShowtime.startsAt))
          : "",
        timeLabel: selectedShowtime ? showtimeStartLabel(selectedShowtime) : "",
        paymentLabel: paymentLabels[paymentMethod],
        admissionCount: getAdmissionCount(booking.seatIds),
        verifiedAge: calculateAge(profile?.dateOfBirth ?? ""),
        seatSubtotal,
        comboSubtotal,
        voucherDiscount,
        pointsDiscount: rewardTotals.pointsDiscount,
        comboLines,
        earnedPoints,
        tierLabel: getTierForLifetimePoints(
          wallet.lifetimePoints + earnedPoints,
        ).label,
      },
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

    if (paymentMethod !== "card") {
      const gateway = gatewayProfiles[paymentMethod];

      setGatewayReference(
        `${gateway.referencePrefix}-${Date.now().toString(36).toUpperCase()}`,
      );
      setOpenGateway(paymentMethod);
      return;
    }

    issueTicket();
  };

  if (!profile) {
    return (
      <section className="checkout-empty-state">
        <UserRoundIcon aria-hidden="true" className="size-8 text-destructive" />
        <h2>Cần đăng nhập để thanh toán</h2>
        <p>
          Vé điện tử được phát hành theo tài khoản CINEVERSE, vì vậy bạn cần
          đăng nhập hoặc tạo tài khoản trước khi hoàn tất đơn hàng.
        </p>
        <Link href="/auth?next=/booking/checkout">
          Đăng nhập / Đăng ký tài khoản
        </Link>
      </section>
    );
  }

  if (showtimeStarted) {
    return (
      <section aria-live="assertive" className="checkout-empty-state">
        <TicketIcon aria-hidden="true" className="size-8 text-destructive" />
        <h2>Suất chiếu đã bắt đầu</h2>
        <p>
          Suất chiếu bạn chọn đã qua giờ chiếu nên đơn hàng không còn hiệu lực.
          Hãy chọn một suất chiếu khác để tiếp tục đặt vé.
        </p>
        <Link
          href={
            booking.movieId
              ? `/showtimes?movie=${encodeURIComponent(booking.movieId)}`
              : "/showtimes"
          }
        >
          Chọn suất chiếu khác
        </Link>
      </section>
    );
  }

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
                <h2>Tài khoản đặt vé</h2>
              </div>
            </div>
            <div className="checkout-account-card">
              <div>
                <strong>{profile.fullName}</strong>
                <small className="account-contact account-contact-icons">
                  <span>
                    <MailIcon aria-hidden="true" />
                    {profile.email}
                  </span>
                  <span>
                    <PhoneIcon aria-hidden="true" />
                    {profile.phone}
                  </span>
                </small>
              </div>
            </div>
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <span>
                <GiftIcon aria-hidden="true" />
              </span>
              <div>
                <h2>Quyền lợi hội viên</h2>
              </div>
            </div>
            <div className="rewards-wallet-card">
              <div>
                <small>HẠNG THÀNH VIÊN</small>
                <strong>{wallet.tierLabel}</strong>
              </div>
              <div>
                <small>ĐIỂM KHẢ DỤNG</small>
                <strong>{wallet.pointsAvailable}</strong>
              </div>
              <div>
                <small>QUY ĐỔI</small>
                <strong>1 điểm = {money.format(POINT_VALUE)}</strong>
              </div>
            </div>
            <div className="rewards-control-grid">
              <label className="form-field">
                <span>Điểm sử dụng</span>
                <Input
                  disabled={rewardTotals.maxPointsRedeemable === 0}
                  inputMode="numeric"
                  max={rewardTotals.maxPointsRedeemable}
                  min={0}
                  onChange={(event) => {
                    const requested = Math.max(
                      0,
                      Math.floor(Number(event.target.value) || 0),
                    );

                    setPointsToRedeem(
                      Math.min(requested, rewardTotals.maxPointsRedeemable),
                    );
                  }}
                  step={1}
                  type="number"
                  value={rewardTotals.pointsRedeemed}
                />
                <small className="reward-empty">
                  Tối đa {rewardTotals.maxPointsRedeemable} điểm cho đơn hàng
                  này. Điểm không quy đổi thành tiền mặt.
                </small>
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
            {/* <p
              className={
                voucherApplied ? "voucher-status is-applied" : "voucher-status"
              }
            >
              {voucherApplied
                ? "Voucher CINE20 đang được áp dụng."
                : "Mock voucher: CINE20 giảm tối đa 20.000 ₫."}
            </p> */}
          </section>

          <section className="checkout-form-section">
            <div className="checkout-section-heading">
              <span>
                <ShieldCheckIcon aria-hidden="true" />
              </span>
              <div>
                <h2>Phương thức thanh toán</h2>
              </div>
            </div>
            <div className="payment-options">
              <div className="payment-option-group">
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
                <div
                  className="payment-collapse"
                  data-open={paymentMethod === "card"}
                  inert={paymentMethod !== "card"}
                >
                  <div className="payment-collapse-inner">
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
                  </div>
                </div>
              </div>
              <label className="payment-option">
                <input
                  checked={paymentMethod === "vnpay"}
                  name="paymentMethod"
                  onChange={() => setPaymentMethod("vnpay")}
                  type="radio"
                />
                <span>
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="payment-option-logo"
                    height={19}
                    src="/assets/vnpay/vnpay-logo.webp"
                    width={24}
                  />
                  <span>
                    <strong>VNPAY</strong>
                    <small>Quét QR bằng ứng dụng ngân hàng hoặc ví VNPAY</small>
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
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="payment-option-logo"
                    height={24}
                    src="/assets/momo/momo-logo.svg"
                    width={24}
                  />
                  <span>
                    <strong>Ví MoMo</strong>
                    <small>
                      Quét QR hoặc xác nhận giao dịch trong ứng dụng
                    </small>
                  </span>
                </span>
              </label>
            </div>
          </section>

          <label
            className={cn(
              "terms-check age-confirm-check",
              errors.age && "has-error",
            )}
          >
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
          <Button
            className="checkout-submit text-[0.77rem] font-extrabold"
            type="submit"
          >
            Xác nhận thanh toán
          </Button>
        </form>
        <CheckoutOrderSummary
          comboSubtotal={comboSubtotal}
          combos={combos}
          comboQuantities={booking.comboQuantities}
          seatIds={booking.seatIds}
          pointsDiscount={rewardTotals.pointsDiscount}
          pointsRedeemed={rewardTotals.pointsRedeemed}
          seatSubtotal={seatSubtotal}
          total={orderTotal}
          voucherDiscount={voucherDiscount}
        />
      </div>
      {openGatewayProfile && (
        <AppModal
          description={`Mở ứng dụng ${openGatewayProfile.name} và xác nhận yêu cầu thanh toán cho đơn hàng CINEVERSE.`}
          descriptionPlacement="body"
          eyebrow="Cổng thanh toán trực tuyến"
          lead={
            <span
              aria-hidden="true"
              className={openGatewayProfile.badgeClassName}
            >
              <Image
                alt=""
                height={openGatewayProfile.logoHeight}
                src={openGatewayProfile.logoPath}
                width={openGatewayProfile.logoWidth}
              />
            </span>
          }
          footer={
            <>
              <Button
                className="gateway-modal-button rounded-full text-[0.77rem] font-extrabold"
                disabled={isConfirmingGateway}
                onClick={() => setOpenGateway(null)}
                variant="outline"
              >
                Hủy giao dịch
              </Button>
              <Button
                className={cn(
                  "gateway-modal-button rounded-full text-[0.77rem] font-extrabold",
                  openGatewayProfile.confirmClassName,
                )}
                disabled={isConfirmingGateway}
                onClick={() => {
                  setIsConfirmingGateway(true);
                  window.setTimeout(() => issueTicket(), 650);
                }}
              >
                {isConfirmingGateway ? "Đang xác nhận" : "Xác nhận thanh toán"}
              </Button>
            </>
          }
          onOpenChange={(open) => {
            if (!isConfirmingGateway && !open) {
              setOpenGateway(null);
            }
          }}
          open={openGateway !== null}
          title={`Xác nhận thanh toán ${openGatewayProfile.name}`}
          bodyClassName="gateway-modal-body"
          bodyLead={
            <Image
              alt={openGatewayProfile.qrAlt}
              className="gateway-qr-image"
              height={150}
              src={openGatewayProfile.qrPath}
              width={150}
            />
          }
        >
          <dl className="gateway-modal-summary">
            <div>
              <dt>Số tiền</dt>
              <dd>{money.format(orderTotal)}</dd>
            </div>
            <div>
              <dt>Mã giao dịch</dt>
              <dd>{gatewayReference}</dd>
            </div>
          </dl>
        </AppModal>
      )}
    </div>
  );
}

function CheckoutOrderSummary({
  combos,
  comboQuantities,
  seatIds,
  seatSubtotal,
  comboSubtotal,
  voucherDiscount,
  pointsDiscount,
  pointsRedeemed,
  total,
}: {
  readonly combos: readonly Combo[];
  readonly comboQuantities: Readonly<Record<string, number>>;
  readonly seatIds: readonly string[];
  readonly seatSubtotal: number;
  readonly comboSubtotal: number;
  readonly voucherDiscount: number;
  readonly pointsDiscount: number;
  readonly pointsRedeemed: number;
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
        {voucherDiscount > 0 && (
          <div className="summary-discount">
            <dt>Voucher CINE20</dt>
            <dd>- {money.format(voucherDiscount)}</dd>
          </div>
        )}
        {pointsDiscount > 0 && (
          <div className="summary-discount">
            <dt>Điểm CINEVERSE ({pointsRedeemed})</dt>
            <dd>- {money.format(pointsDiscount)}</dd>
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

import type { Ticket } from "@/types/domain";

export const POINT_EARN_DIVISOR = 10000;

/** Mỗi điểm CINEVERSE quy đổi được 1.000 ₫ khi thanh toán. */
export const POINT_VALUE = 1000;

export interface MemberTier {
  readonly code: string;
  readonly label: string;
  readonly threshold: number;
}

const MEMBER_TIERS: readonly MemberTier[] = [
  { code: "POPCORN_FAN", label: "Fan Bắp Rang", threshold: 0 },
  { code: "MOVIE_ADDICT", label: "Người Mê Phim", threshold: 500 },
  { code: "MOVIE_HOLIC", label: "Mọt Phim Cày Xuyên Đêm", threshold: 1500 },
  { code: "CINEMA_LEGEND", label: "Huyền Thoại Cineverse", threshold: 3500 },
];

export function getTierForLifetimePoints(points: number): MemberTier {
  const total = Math.max(0, Number(points) || 0);

  return MEMBER_TIERS.reduce(
    (selected, tier) => (total >= tier.threshold ? tier : selected),
    MEMBER_TIERS[0],
  );
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function isValidDateOfBirth(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= today &&
    year >= 1900
  );
}

export function formatDateOfBirth(value: string) {
  if (!value) {
    return "Chưa cập nhật";
  }

  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

export function formatTransactionDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function calculateAge(dateOfBirth: string): number | null {
  if (!isValidDateOfBirth(dateOfBirth)) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CV"
  );
}

export function getLastName(name: string) {
  const parts = name.trim().split(/\s+/);

  return parts[parts.length - 1] || "Tài khoản";
}

export interface MemberTransaction {
  readonly id: string;
  readonly type: "ticket-purchase" | "birthday-voucher-issued";
  readonly label: string;
  readonly createdAt: string;
  readonly earnedPoints?: number;
  readonly redeemedPoints?: number;
}

export interface MemberVoucher {
  readonly id: string;
  readonly label: string;
  readonly issuedAt: string;
}

export interface MemberWallet {
  readonly pointsAvailable: number;
  readonly lifetimePoints: number;
  readonly tierLabel: string;
  readonly vouchers: readonly MemberVoucher[];
  readonly transactions: readonly MemberTransaction[];
}

function addMonths(date: Date, months: number) {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);

  return next;
}

function getBirthdayVouchers(
  dateOfBirth: string,
  createdAt: string,
): readonly MemberVoucher[] {
  if (!isValidDateOfBirth(dateOfBirth)) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birth = new Date(`${dateOfBirth}T00:00:00`);
  const registered = new Date(createdAt);
  registered.setHours(0, 0, 0, 0);

  const isBirthday =
    birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();

  if (!isBirthday || today < addMonths(registered, 12)) {
    return [];
  }

  return [
    {
      id: `CV-BDAY-${today.getFullYear()}`,
      label: "Vé xem phim sinh nhật",
      issuedAt: today.toISOString(),
    },
  ];
}

/**
 * Điểm thưởng được suy ra từ lịch sử vé thay vì lưu riêng, giữ đúng công thức
 * của frontend legacy: mỗi 10.000đ hóa đơn đổi được 1 điểm.
 */
export function deriveMemberWallet(
  tickets: readonly Ticket[],
  dateOfBirth: string,
  createdAt: string,
): MemberWallet {
  const purchases = tickets.map((ticket) => ({
    ticket,
    earnedPoints: Math.floor(ticket.total / POINT_EARN_DIVISOR),
  }));

  const lifetimePoints = purchases.reduce(
    (total, purchase) => total + purchase.earnedPoints,
    0,
  );
  const pointsRedeemed = tickets.reduce(
    (total, ticket) => total + (ticket.pointsRedeemed ?? 0),
    0,
  );
  const usedVoucherIds = new Set(
    tickets
      .map((ticket) => ticket.voucherId)
      .filter((voucherId): voucherId is string => Boolean(voucherId)),
  );

  const vouchers = getBirthdayVouchers(dateOfBirth, createdAt).filter(
    (voucher) => !usedVoucherIds.has(voucher.id),
  );

  const transactions: MemberTransaction[] = [
    ...vouchers.map((voucher) => ({
      id: `reward-${voucher.id}`,
      type: "birthday-voucher-issued" as const,
      label: "Tặng voucher vé xem phim sinh nhật",
      createdAt: voucher.issuedAt,
    })),
    ...purchases.map((purchase) => ({
      id: `purchase-${purchase.ticket.id}`,
      type: "ticket-purchase" as const,
      label: `Mua vé ${purchase.ticket.code}`,
      createdAt: purchase.ticket.createdAt,
      earnedPoints: purchase.earnedPoints,
      redeemedPoints: purchase.ticket.pointsRedeemed,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    pointsAvailable: Math.max(0, lifetimePoints - pointsRedeemed),
    lifetimePoints,
    tierLabel: getTierForLifetimePoints(lifetimePoints).label,
    vouchers,
    transactions,
  };
}

export interface RewardSelection {
  readonly pointsToRedeem: number;
  readonly birthdayVoucherId: string;
}

export interface RewardTotals {
  /** Voucher sinh nhật thực sự áp dụng được, rỗng nếu lựa chọn đã hết hiệu lực. */
  readonly voucherId: string;
  readonly voucherDiscount: number;
  readonly pointsRedeemed: number;
  readonly pointsDiscount: number;
  readonly maxPointsRedeemable: number;
  readonly rewardDiscount: number;
}

/**
 * Quy đổi quyền lợi hội viên cho một đơn hàng, giữ đúng công thức của frontend
 * legacy: voucher sinh nhật miễn phí vé đắt nhất, phần còn lại mới trừ điểm.
 */
export function calculateRewardTotals({
  productSubtotal,
  admissionPrices,
  wallet,
  selection,
}: {
  readonly productSubtotal: number;
  readonly admissionPrices: readonly number[];
  readonly wallet: MemberWallet;
  readonly selection: RewardSelection;
}): RewardTotals {
  const voucher = wallet.vouchers.find(
    (item) => item.id === selection.birthdayVoucherId,
  );
  const voucherDiscount =
    voucher && admissionPrices.length ? Math.max(...admissionPrices) : 0;
  const redeemableAfterVoucher = Math.max(0, productSubtotal - voucherDiscount);
  const maxPointsRedeemable = Math.min(
    wallet.pointsAvailable,
    Math.floor(redeemableAfterVoucher / POINT_VALUE),
  );
  const pointsRedeemed = Math.min(
    Math.max(0, Math.floor(selection.pointsToRedeem)),
    maxPointsRedeemable,
  );
  const pointsDiscount = pointsRedeemed * POINT_VALUE;

  return {
    voucherId: voucher?.id ?? "",
    voucherDiscount,
    pointsRedeemed,
    pointsDiscount,
    maxPointsRedeemable,
    rewardDiscount: voucherDiscount + pointsDiscount,
  };
}

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_EDGE = 420;

export function validateAvatarDataUrl(value: string) {
  return (
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) &&
    value.length <= 950000
  );
}

/**
 * Thu nhỏ ảnh về tối đa 420px cạnh dài rồi encode JPEG để vừa hạn mức lưu trữ
 * của trình duyệt, giống pipeline avatar của frontend legacy.
 */
export function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Vui lòng chọn một tệp hình ảnh hợp lệ."));
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      reject(new Error("Ảnh đại diện không được vượt quá 5 MB."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Không thể đọc tệp hình ảnh đã chọn."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(new Error("Không thể xử lý tệp hình ảnh đã chọn."));

      image.onload = () => {
        const scale = Math.min(
          1,
          AVATAR_MAX_EDGE / Math.max(image.width, image.height),
        );
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Không thể xử lý tệp hình ảnh đã chọn."));
          return;
        }

        context.fillStyle = "#101522";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };

      image.src = String(reader.result ?? "");
    };

    reader.readAsDataURL(file);
  });
}

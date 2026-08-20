"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CakeIcon,
  CameraIcon,
  CrownIcon,
  GiftIcon,
  LockIcon,
  LogOutIcon,
  PencilIcon,
  ShieldCheckIcon,
  StarIcon,
  Trash2Icon,
  TicketIcon,
} from "lucide-react";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useFeedback } from "@/components/feedback/feedback-provider";
import {
  calculateAge,
  deriveMemberWallet,
  formatDateOfBirth,
  formatTransactionDate,
  getInitials,
  resizeAvatar,
} from "@/lib/member";
import { useBookingStore } from "@/lib/stores/booking.store";
import { useAuthStore, type AuthProfile } from "@/lib/stores/auth.store";

const HISTORY_LIMIT = 5;

export function MemberProfile({
  profile,
  nextPath,
}: {
  readonly profile: AuthProfile;
  readonly nextPath: string | null;
}) {
  const { notify } = useFeedback();
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updateAvatar = useAuthStore((state) => state.updateAvatar);
  const tickets = useBookingStore((state) => state.tickets);
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const isProfileDirty =
    fullName.trim() !== profile.fullName ||
    email.trim() !== profile.email ||
    phone.trim() !== profile.phone;

  const wallet = useMemo(
    () =>
      deriveMemberWallet(tickets, profile.dateOfBirth, profile.createdAt),
    [tickets, profile.dateOfBirth, profile.createdAt],
  );

  const latestTicket = tickets[0] ?? null;
  const age = calculateAge(profile.dateOfBirth);
  const history = wallet.transactions.slice(0, HISTORY_LIMIT);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const dataUrl = await resizeAvatar(file);
      const result = updateAvatar(dataUrl);

      if (!result.ok) {
        notify(result.error ?? "Không thể cập nhật ảnh đại diện.", "error");
        return;
      }

      notify("Ảnh đại diện đã được cập nhật.", "success");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Không thể xử lý tệp hình ảnh đã chọn.",
        "error",
      );
    }
  };

  const handleAvatarRemove = () => {
    const result = updateAvatar("");

    if (!result.ok) {
      notify(result.error ?? "Không thể xóa ảnh đại diện.", "error");
      return;
    }

    notify("Ảnh đại diện đã được xóa.", "success");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = updateProfile({ fullName, email, phone });

    if (!result.ok) {
      notify(result.error ?? "Không thể cập nhật hồ sơ.", "error");
      return;
    }

    notify("Đã cập nhật hồ sơ tài khoản.", "success");
  };

  return (
    <div className="profile-layout">
      <aside className="profile-card">
        <div className="profile-avatar">
          {profile.avatarDataUrl ? (
            // Ảnh là data URL do người dùng tải lên nên không dùng next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Ảnh đại diện"
              className="profile-avatar-image"
              src={profile.avatarDataUrl}
            />
          ) : (
            <span>{getInitials(profile.fullName)}</span>
          )}
        </div>
        <div className="profile-avatar-actions">
          <label className="cv-btn cv-btn-ghost cv-btn-small" htmlFor="avatar-upload">
            <CameraIcon aria-hidden="true" className="size-4" />
            Đổi ảnh
            <input
              accept="image/png,image/jpeg,image/webp"
              hidden
              id="avatar-upload"
              onChange={handleAvatarChange}
              type="file"
            />
          </label>
          {profile.avatarDataUrl ? (
            <button
              className="cv-btn cv-btn-text cv-btn-small"
              onClick={handleAvatarRemove}
              type="button"
            >
              <Trash2Icon aria-hidden="true" className="size-3.75" />
              Xóa ảnh
            </button>
          ) : null}
        </div>
        <h2>{profile.fullName}</h2>
        <p>{profile.email}</p>
        <dl className="profile-mini-list">
          <div>
            <dt>Hạng hội viên</dt>
            <dd>{wallet.tierLabel}</dd>
          </div>
          <div>
            <dt>Điểm khả dụng</dt>
            <dd>{wallet.pointsAvailable} điểm</dd>
          </div>
          <div>
            <dt>Tuổi hiện tại</dt>
            <dd>{age === null ? "Chưa xác định" : `${age} tuổi`}</dd>
          </div>
          <div>
            <dt>Ngày sinh</dt>
            <dd>{formatDateOfBirth(profile.dateOfBirth)}</dd>
          </div>
          <div>
            <dt>Vé gần nhất</dt>
            <dd>{latestTicket ? latestTicket.code : "Chưa có"}</dd>
          </div>
        </dl>
        <button
          className="cv-btn cv-btn-ghost cv-btn-block"
          onClick={() => {
            logout();
            notify("Bạn đã đăng xuất.", "success");
          }}
          type="button"
        >
          <LogOutIcon aria-hidden="true" className="size-4.5" />
          Đăng xuất
        </button>
      </aside>

      <section className="profile-content">
        <div className="profile-heading">
          <div>
            <p className="auth-eyebrow">HỒ SƠ HỘI VIÊN</p>
            <h1>Thông tin tài khoản</h1>
          </div>
          <span>
            <ShieldCheckIcon aria-hidden="true" className="size-5" />
            Đã xác minh
          </span>
        </div>

        <div
          aria-describedby="member-wallet-tooltip"
          className="member-wallet-panel"
          tabIndex={0}
        >
          <div className="member-wallet-head">
            <span>
              <CrownIcon aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="auth-eyebrow">CINEVERSE REWARDS</p>
              <h3>{wallet.tierLabel}</h3>
            </div>
          </div>
          <div className="member-wallet-stats">
            <div>
              <small>ĐIỂM KHẢ DỤNG</small>
              <strong>{wallet.pointsAvailable}</strong>
            </div>
            <div>
              <small>TỔNG ĐIỂM TÍCH LŨY</small>
              <strong>{wallet.lifetimePoints}</strong>
            </div>
            <div>
              <small>VOUCHER KHẢ DỤNG</small>
              <strong>{wallet.vouchers.length}</strong>
            </div>
          </div>
          <p
            className="member-wallet-tooltip"
            id="member-wallet-tooltip"
            role="tooltip"
          >
            Điểm CINEVERSE được sử dụng để quy đổi vé và sản phẩm đang bán trong
            hệ thống. Điểm không có giá trị quy đổi thành tiền mặt.
          </p>
        </div>

        {wallet.vouchers.length ? (
          <div className="profile-voucher-list">
            <h3>Voucher của bạn</h3>
            {wallet.vouchers.map((voucher) => (
              <article key={voucher.id}>
                <span>
                  <GiftIcon aria-hidden="true" className="size-4.5" />
                </span>
                <div>
                  <strong>{voucher.label}</strong>
                  <small>Miễn phí 01 vé xem phim · Sử dụng 01 lần</small>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <form className="profile-form" noValidate onSubmit={handleSubmit}>
          <div className="auth-form-grid">
            <label className="form-field form-field-wide">
              <span>Email</span>
              <input
                autoComplete="email"
                className="cv-input"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="form-field form-field-wide">
              <span>Họ và tên</span>
              <input
                autoComplete="name"
                className="cv-input"
                onChange={(event) => setFullName(event.target.value)}
                required
                type="text"
                value={fullName}
              />
            </label>
            <label className="form-field">
              <span>Số điện thoại</span>
              <input
                autoComplete="tel"
                className="cv-input"
                onChange={(event) => setPhone(event.target.value)}
                required
                type="tel"
                value={phone}
              />
            </label>
            <label
              className="form-field profile-locked-field birthday-field"
              tabIndex={0}
            >
              <span>Ngày sinh</span>
              <div className="locked-input">
                <input
                  className="cv-input"
                  disabled
                  type="text"
                  value={formatDateOfBirth(profile.dateOfBirth)}
                />
                <i>
                  <LockIcon aria-hidden="true" className="size-4" />
                </i>
              </div>
              <div className="profile-status birthday-tooltip" role="tooltip">
                <span>
                  <CakeIcon aria-hidden="true" className="size-5.5" />
                </span>
                <div>
                  <strong>Thông tin cá nhân đã xác thực</strong>
                  <p>
                    Ngày sinh được khóa sau khi đăng ký. Liên hệ quầy dịch vụ khi
                    cần điều chỉnh thông tin.
                  </p>
                </div>
              </div>
            </label>
          </div>
          <button
            className="cv-btn cv-btn-primary"
            disabled={!isProfileDirty}
            type="submit"
          >
            <PencilIcon aria-hidden="true" className="size-4.5" />
            Lưu thay đổi
          </button>
        </form>

        {history.length ? (
          <div className="member-history">
            <h3>Lịch sử quyền lợi</h3>
            {history.map((entry) => (
              <div key={entry.id}>
                <span>
                  {entry.type === "birthday-voucher-issued" ? (
                    <GiftIcon aria-hidden="true" className="size-4" />
                  ) : (
                    <StarIcon aria-hidden="true" className="size-4" />
                  )}
                </span>
                <p>
                  <strong>{entry.label}</strong>
                  <small>
                    {formatTransactionDate(entry.createdAt)}
                    {entry.earnedPoints
                      ? ` · +${entry.earnedPoints} điểm`
                      : ""}
                    {entry.redeemedPoints
                      ? ` · -${entry.redeemedPoints} điểm`
                      : ""}
                  </small>
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="profile-actions">
          {latestTicket ? (
            <Link
              className="cv-btn cv-btn-ghost"
              href={`/ticket/${latestTicket.id}`}
            >
              <TicketIcon aria-hidden="true" className="size-4.5" />
              Mở vé gần nhất
            </Link>
          ) : (
            <Link className="cv-btn cv-btn-ghost" href="/movies">
              <TicketIcon aria-hidden="true" className="size-4.5" />
              Đặt vé ngay
            </Link>
          )}
          {nextPath ? (
            <Link className="cv-btn cv-btn-primary" href={nextPath}>
              Tiếp tục
              <ArrowRightIcon aria-hidden="true" className="size-4.5" />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

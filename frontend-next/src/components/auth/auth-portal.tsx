"use client";

import {
  ArrowRightIcon,
  ShieldCheckIcon,
  StarIcon,
  TicketIcon,
} from "lucide-react";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { useAuthStore } from "@/lib/stores/auth.store";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

interface GuestFormValues {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly dateOfBirth: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly remember: boolean;
  readonly acceptedTerms: boolean;
}

type FormErrors = Partial<Record<keyof GuestFormValues, string>>;

const initialGuestForm: GuestFormValues = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
  remember: false,
  acceptedTerms: false,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vietnamesePhonePattern = /^(0|\+84)[0-9]{9,10}$/;

const fieldInputClass = "h-12 rounded-[0.625rem] px-3 text-base";

function validateGuestForm(values: GuestFormValues, tab: AuthTab): FormErrors {
  const errors: FormErrors = {};

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  }

  if (values.password.length < 6) {
    errors.password = "Mật khẩu cần có ít nhất 6 ký tự.";
  }

  if (tab === "register") {
    if (values.fullName.trim().length < 2) {
      errors.fullName = "Vui lòng nhập họ và tên hợp lệ.";
    }

    if (!vietnamesePhonePattern.test(values.phone.replace(/\s/g, ""))) {
      errors.phone = "Vui lòng nhập số điện thoại Việt Nam hợp lệ.";
    }

    if (!values.dateOfBirth) {
      errors.dateOfBirth = "Vui lòng cung cấp ngày sinh để xác thực độ tuổi.";
    }

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    }

    if (!values.acceptedTerms) {
      errors.acceptedTerms = "Bạn cần đồng ý với điều khoản để tạo tài khoản.";
    }
  }

  return errors;
}

function FieldError({ message }: { readonly message?: string }) {
  if (!message) {
    return null;
  }

  return <small className="form-field-error">{message}</small>;
}

export function AuthPortal() {
  const { notify } = useFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const profile = useAuthStore((state) => state.profile);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [values, setValues] = useState<GuestFormValues>(initialGuestForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const setTextField = (field: keyof GuestFormValues) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

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

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateGuestForm(values, activeTab);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      notify("Vui lòng kiểm tra lại các trường được đánh dấu.", "error");
      return;
    }

    login({
      fullName:
        activeTab === "register" ? values.fullName.trim() : "Khách Cineverse",
      email: values.email.trim(),
      phone: activeTab === "register" ? values.phone.trim() : "Chưa cập nhật",
    });
    notify(
      activeTab === "register"
        ? "Tạo tài khoản thành công. Chào mừng bạn đến với CINEVERSE."
        : "Đăng nhập thành công.",
      "success",
    );

    if (nextPath) {
      router.push(nextPath);
    }
  };

  if (profile) {
    return (
      <section className="auth-page">
        <AuthHero />
        <div className="auth-section">
          <div className="auth-layout profile-layout">
            <aside className="auth-benefits">
              <p className="auth-eyebrow">CINEVERSE MEMBER</p>
              <h2>Trải nghiệm điện ảnh, theo cách của bạn.</h2>
              <p className="auth-benefit-copy">
                Thông tin bên dưới đang dùng mock state và sẽ được thay bằng API
                tài khoản ở giai đoạn Backend.
              </p>
            </aside>
            <form
              className="auth-card auth-form-panel"
              onSubmit={(event) => {
                event.preventDefault();
                notify("Đã cập nhật hồ sơ tài khoản.", "success");
              }}
            >
              <div className="auth-form-heading">
                <p className="auth-eyebrow">HỒ SƠ HỘI VIÊN</p>
                <h2>Tài khoản của bạn</h2>
                <p>Chỉnh sửa thông tin liên hệ cho các đơn hàng tiếp theo.</p>
              </div>
              <div className="auth-form-grid">
                <label className="form-field form-field-wide">
                  <span>Họ và tên</span>
                  <Input defaultValue={profile.fullName} name="fullName" />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <Input
                    defaultValue={profile.email}
                    name="email"
                    type="email"
                  />
                </label>
                <label className="form-field">
                  <span>Số điện thoại</span>
                  <Input defaultValue={profile.phone} name="phone" type="tel" />
                </label>
              </div>
              <Button className="w-full" type="submit">
                Lưu thay đổi
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  logout();
                  setValues(initialGuestForm);
                  setActiveTab("login");
                  notify("Bạn đã đăng xuất khỏi tài khoản mock.", "success");
                }}
                type="button"
                variant="outline"
              >
                Đăng xuất mock
              </Button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <AuthHero />
      <div className="auth-section">
        <div className="auth-layout">
          <aside className="auth-benefits">
            <p className="auth-eyebrow">MEMBER EXPERIENCE</p>
            <h2>
              Điện ảnh.
              <br />
              Đúng chất riêng.
            </h2>
            <div className="auth-benefit-list">
              <Benefit
                icon={<TicketIcon className="size-5" />}
                title="Vé điện tử"
              >
                Truy cập mã vé gần nhất ngay trong tài khoản hội viên.
              </Benefit>
              <Benefit
                icon={<StarIcon className="size-5" />}
                title="Quyền lợi hội viên"
              >
                Nhận thông tin về suất chiếu đặc biệt và các chương trình ưu
                đãi.
              </Benefit>
              <Benefit
                icon={<ShieldCheckIcon className="size-5" />}
                title="Hồ sơ cá nhân"
              >
                Quản lý thông tin liên hệ và ảnh đại diện của bạn.
              </Benefit>
            </div>
          </aside>
          <div className="auth-card">
            <div
              aria-label="Chọn hình thức xác thực"
              className="auth-tabs"
              role="tablist"
            >
              <button
                aria-controls="auth-form"
                aria-selected={activeTab === "login"}
                className={cn("auth-tab", activeTab === "login" && "is-active")}
                onClick={() => switchTab("login")}
                role="tab"
                type="button"
              >
                Đăng nhập
              </button>
              <button
                aria-controls="auth-form"
                aria-selected={activeTab === "register"}
                className={cn(
                  "auth-tab",
                  activeTab === "register" && "is-active",
                )}
                onClick={() => switchTab("register")}
                role="tab"
                type="button"
              >
                Đăng ký
              </button>
            </div>
            <form
              className="auth-form-panel"
              id="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-form-heading">
                <h2>
                  {activeTab === "register"
                    ? "Tạo tài khoản"
                    : "Chào mừng trở lại"}
                </h2>
                <p>
                  {activeTab === "register"
                    ? "Đăng ký hội viên CINEVERSE để bắt đầu."
                    : "Đăng nhập tài khoản CINEVERSE của bạn."}
                </p>
              </div>
              <div className="auth-form-grid">
                {activeTab === "register" && (
                  <label className="form-field form-field-wide">
                    <span>Họ và tên</span>
                    <Input
                      aria-invalid={Boolean(errors.fullName) || undefined}
                      autoComplete="name"
                      className={fieldInputClass}
                      onChange={setTextField("fullName")}
                      placeholder="Nguyễn Văn An"
                      value={values.fullName}
                    />
                    <FieldError message={errors.fullName} />
                  </label>
                )}
                <label className="form-field form-field-wide">
                  <span>Email</span>
                  <Input
                    aria-invalid={Boolean(errors.email) || undefined}
                    autoComplete="email"
                    className={fieldInputClass}
                    onChange={setTextField("email")}
                    placeholder="an@example.com"
                    type="email"
                    value={values.email}
                  />
                  <FieldError message={errors.email} />
                </label>
                {activeTab === "register" && (
                  <>
                    <label className="form-field">
                      <span>Số điện thoại</span>
                      <Input
                        aria-invalid={Boolean(errors.phone) || undefined}
                        autoComplete="tel"
                        className={fieldInputClass}
                        inputMode="tel"
                        onChange={setTextField("phone")}
                        placeholder="0912345678"
                        type="tel"
                        value={values.phone}
                      />
                      <FieldError message={errors.phone} />
                    </label>
                    <label className="form-field">
                      <span>Ngày sinh</span>
                      <Input
                        aria-invalid={Boolean(errors.dateOfBirth) || undefined}
                        autoComplete="bday"
                        className={fieldInputClass}
                        max={new Date().toISOString().slice(0, 10)}
                        min="1900-01-01"
                        onChange={setTextField("dateOfBirth")}
                        type="date"
                        value={values.dateOfBirth}
                      />
                      <FieldError message={errors.dateOfBirth} />
                    </label>
                  </>
                )}
                <label
                  className={cn(
                    "form-field",
                    activeTab === "login" && "form-field-wide",
                  )}
                >
                  <span>Mật khẩu</span>
                  <Input
                    aria-invalid={Boolean(errors.password) || undefined}
                    autoComplete={
                      activeTab === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    className={fieldInputClass}
                    onChange={setTextField("password")}
                    placeholder={
                      activeTab === "register"
                        ? "Tối thiểu 6 ký tự"
                        : "Nhập mật khẩu"
                    }
                    type="password"
                    value={values.password}
                  />
                  <FieldError message={errors.password} />
                </label>
                {activeTab === "register" && (
                  <label className="form-field">
                    <span>Xác nhận mật khẩu</span>
                    <Input
                      aria-invalid={
                        Boolean(errors.confirmPassword) || undefined
                      }
                      autoComplete="new-password"
                      className={fieldInputClass}
                      onChange={setTextField("confirmPassword")}
                      placeholder="Nhập lại mật khẩu"
                      type="password"
                      value={values.confirmPassword}
                    />
                    <FieldError message={errors.confirmPassword} />
                  </label>
                )}
              </div>
              <label className="terms-check">
                <input
                  checked={values.remember}
                  onChange={setTextField("remember")}
                  type="checkbox"
                />
                <span>Duy trì trạng thái đăng nhập trên thiết bị này.</span>
              </label>
              {activeTab === "register" && (
                <label className="terms-check">
                  <input
                    checked={values.acceptedTerms}
                    onChange={setTextField("acceptedTerms")}
                    type="checkbox"
                  />
                  <span>
                    Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của
                    CINEVERSE.
                  </span>
                </label>
              )}
              <FieldError message={errors.acceptedTerms} />
              <Button
                className="h-12 w-full gap-2 px-4 text-sm font-extrabold uppercase tracking-[0.08em]"
                type="submit"
              >
                {activeTab === "register" ? "Tạo tài khoản" : "Đăng nhập"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              {activeTab === "login" && (
                <p className="auth-helper">
                  Chưa có tài khoản?{" "}
                  <button onClick={() => switchTab("register")} type="button">
                    Đăng ký ngay
                  </button>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthHero() {
  return (
    <header className="auth-hero">
      <div className="auth-hero-inner">
        <div>
          <p className="auth-eyebrow">CINEVERSE MEMBER</p>
          <h1>Tài khoản của bạn</h1>
          <p>
            Quản lý hồ sơ hội viên, vé điện tử và các thông tin cần thiết cho
            trải nghiệm tại rạp.
          </p>
        </div>
        <div className="auth-security-note">
          <ShieldCheckIcon aria-hidden="true" className="size-7" />
          <div>
            <strong>BẢO MẬT HỘI VIÊN</strong>
            <p>
              Chúng tôi cam kết thông tin cá nhân của bạn được bảo vệ và chỉ
              được sử dụng cho các dịch vụ CINEVERSE.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function Benefit({
  icon,
  title,
  children,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <div>
      <span>{icon}</span>
      <p>
        <strong>{title}</strong>
        <small>{children}</small>
      </p>
    </div>
  );
}

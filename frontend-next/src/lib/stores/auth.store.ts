"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { validateAvatarDataUrl } from "@/lib/member";
import {
  hashPassword,
  normalizeEmail,
  useAccountsStore,
  type RegisteredAccount,
} from "./accounts.store";

export type AuthProfile = Omit<RegisteredAccount, "passwordHash">;

export interface RegisterInput {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly dateOfBirth: string;
  readonly password: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface ProfileUpdateInput {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
}

export interface AuthActionResult {
  readonly ok: boolean;
  readonly error?: string;
}

interface AuthStore {
  readonly sessionEmail: string | null;
  register(input: RegisterInput): AuthActionResult;
  login(input: LoginInput): AuthActionResult;
  updateProfile(input: ProfileUpdateInput): AuthActionResult;
  updateAvatar(dataUrl: string): AuthActionResult;
  logout(): void;
}

const vietnamesePhonePattern = /^(0|\+84)[0-9]{9,10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      sessionEmail: null,
      register: ({ fullName, email, phone, dateOfBirth, password }) => {
        const normalizedEmail = normalizeEmail(email);

        if (useAccountsStore.getState().findAccount(normalizedEmail)) {
          return {
            ok: false,
            error: "Email này đã được đăng ký. Vui lòng đăng nhập.",
          };
        }

        useAccountsStore.getState().addAccount({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          dateOfBirth,
          passwordHash: hashPassword(password),
          avatarDataUrl: "",
          createdAt: new Date().toISOString(),
        });
        set({ sessionEmail: normalizedEmail });

        return { ok: true };
      },
      login: ({ email, password }) => {
        const account = useAccountsStore.getState().findAccount(email);

        if (!account || account.passwordHash !== hashPassword(password)) {
          return {
            ok: false,
            error:
              "Email hoặc mật khẩu chưa chính xác. Vui lòng đăng ký nếu chưa có tài khoản.",
          };
        }

        set({ sessionEmail: account.email });

        return { ok: true };
      },
      updateProfile: ({ fullName, email, phone }) => {
        const sessionEmail = get().sessionEmail;

        if (!sessionEmail) {
          return { ok: false, error: "Phiên đăng nhập không còn hợp lệ." };
        }

        const trimmedName = fullName.trim();
        const trimmedPhone = phone.replace(/\s/g, "").trim();
        const normalizedEmail = normalizeEmail(email);

        if (trimmedName.length < 2) {
          return { ok: false, error: "Vui lòng nhập họ và tên hợp lệ." };
        }

        if (!emailPattern.test(normalizedEmail)) {
          return { ok: false, error: "Vui lòng nhập địa chỉ email hợp lệ." };
        }

        if (!vietnamesePhonePattern.test(trimmedPhone)) {
          return {
            ok: false,
            error: "Vui lòng nhập số điện thoại Việt Nam hợp lệ.",
          };
        }

        if (normalizedEmail !== sessionEmail) {
          const renamed = useAccountsStore
            .getState()
            .changeAccountEmail(sessionEmail, normalizedEmail);

          if (!renamed) {
            return {
              ok: false,
              error: "Email này đã được sử dụng cho một tài khoản khác.",
            };
          }
        }

        useAccountsStore.getState().patchAccount(normalizedEmail, {
          fullName: trimmedName,
          phone: trimmedPhone,
        });
        set({ sessionEmail: normalizedEmail });

        return { ok: true };
      },
      updateAvatar: (dataUrl) => {
        const sessionEmail = get().sessionEmail;

        if (!sessionEmail) {
          return { ok: false, error: "Phiên đăng nhập không còn hợp lệ." };
        }

        if (dataUrl && !validateAvatarDataUrl(dataUrl)) {
          return {
            ok: false,
            error: "Ảnh đại diện chưa hợp lệ hoặc vượt quá dung lượng cho phép.",
          };
        }

        useAccountsStore
          .getState()
          .patchAccount(sessionEmail, { avatarDataUrl: dataUrl });

        return { ok: true };
      },
      logout: () => set({ sessionEmail: null }),
    }),
    {
      name: "cineverse.auth.v2",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

/**
 * Hồ sơ luôn được đọc lại từ registry tài khoản để tránh lệch dữ liệu khi người
 * dùng cập nhật thông tin hoặc ảnh đại diện.
 */
export function useCurrentProfile(): AuthProfile | null {
  const sessionEmail = useAuthStore((state) => state.sessionEmail);
  const account = useAccountsStore((state) =>
    sessionEmail ? state.accounts[sessionEmail] : undefined,
  );

  if (!account) {
    return null;
  }

  return {
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    dateOfBirth: account.dateOfBirth,
    avatarDataUrl: account.avatarDataUrl,
    createdAt: account.createdAt,
  };
}

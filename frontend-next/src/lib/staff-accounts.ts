"use client";

const STAFF_USERS_KEY = "cineverse.staff-users.v1";
const ROLE_GATE_CONTROL_ADMIN = "gate-control-admin" as const;

interface StaffAccount {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: typeof ROLE_GATE_CONTROL_ADMIN;
  readonly status: "active";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateAdminValues {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

type StaffResult =
  | { readonly ok: true; readonly user: StaffAccount }
  | { readonly ok: false; readonly error: string };

function readAccounts(): StaffAccount[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STAFF_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: readonly StaffAccount[]) {
  window.localStorage.setItem(STAFF_USERS_KEY, JSON.stringify(accounts));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveHash(value: string) {
  const text = `cineverse::staff-auth::v1::${value}`;
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return `cv-staff-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function generateId() {
  return `cv-staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hasAdmin() {
  return readAccounts().some(
    (user) => user.role === ROLE_GATE_CONTROL_ADMIN && user.status === "active",
  );
}

export function validateAdminValues(values: CreateAdminValues) {
  const fullName = values.fullName.trim();
  const email = normalizeEmail(values.email);
  const password = values.password;

  if (fullName.length < 2) {
    return "Vui lòng nhập họ và tên nhân viên hợp lệ.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Vui lòng nhập email nhân viên hợp lệ.";
  }

  if (password.length < 10) {
    return "Mật khẩu nhân viên phải có ít nhất 10 ký tự.";
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Mật khẩu nhân viên cần có chữ hoa, chữ thường và chữ số.";
  }

  if (password !== values.confirmPassword) {
    return "Mật khẩu xác nhận chưa trùng khớp.";
  }

  return "";
}

export function createInitialAdmin(values: CreateAdminValues): StaffResult {
  if (hasAdmin()) {
    return {
      ok: false,
      error: "Tài khoản quản trị ban đầu đã được thiết lập.",
    };
  }

  const error = validateAdminValues(values);

  if (error) {
    return { ok: false, error };
  }

  const accounts = readAccounts();
  const admin: StaffAccount = {
    id: generateId(),
    fullName: values.fullName.trim(),
    email: normalizeEmail(values.email),
    passwordHash: deriveHash(values.password),
    role: ROLE_GATE_CONTROL_ADMIN,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  accounts.push(admin);
  writeAccounts(accounts);

  return { ok: true, user: admin };
}

export function loginStaff(email: string, password: string): StaffResult {
  const normalizedEmail = normalizeEmail(email);
  const admin = readAccounts().find(
    (user) =>
      normalizeEmail(user.email) === normalizedEmail &&
      user.role === ROLE_GATE_CONTROL_ADMIN &&
      user.status === "active",
  );

  if (!admin || admin.passwordHash !== deriveHash(password)) {
    return {
      ok: false,
      error: "Email hoặc mật khẩu nhân viên chưa chính xác.",
    };
  }

  return { ok: true, user: admin };
}

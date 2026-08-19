"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface RegisteredAccount {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly dateOfBirth: string;
  readonly passwordHash: string;
  readonly avatarDataUrl: string;
  readonly createdAt: string;
}

export type AccountPatch = Partial<
  Pick<RegisteredAccount, "fullName" | "phone" | "avatarDataUrl">
>;

interface AccountsStore {
  readonly accounts: Record<string, RegisteredAccount>;
  addAccount(account: RegisteredAccount): void;
  patchAccount(email: string, patch: AccountPatch): void;
  changeAccountEmail(currentEmail: string, nextEmail: string): boolean;
  findAccount(email: string): RegisteredAccount | undefined;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const text = `cineverse-auth::${password}`;
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const useAccountsStore = create<AccountsStore>()(
  persist(
    (set, get) => ({
      accounts: {},
      addAccount: (account) => {
        set((state) => ({
          accounts: { ...state.accounts, [account.email]: account },
        }));
      },
      patchAccount: (email, patch) => {
        const key = normalizeEmail(email);

        set((state) => {
          const existing = state.accounts[key];

          if (!existing) {
            return state;
          }

          return {
            accounts: { ...state.accounts, [key]: { ...existing, ...patch } },
          };
        });
      },
      changeAccountEmail: (currentEmail, nextEmail) => {
        const currentKey = normalizeEmail(currentEmail);
        const nextKey = normalizeEmail(nextEmail);

        if (currentKey === nextKey) {
          return true;
        }

        const state = get();
        const existing = state.accounts[currentKey];

        if (!existing || state.accounts[nextKey]) {
          return false;
        }

        set((current) => {
          const rest = { ...current.accounts };
          delete rest[currentKey];

          return {
            accounts: {
              ...rest,
              [nextKey]: { ...existing, email: nextKey },
            },
          };
        });

        return true;
      },
      findAccount: (email) => get().accounts[normalizeEmail(email)],
    }),
    {
      name: "cineverse.accounts.v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthProfile {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
}

interface AuthStore {
  readonly profile: AuthProfile | null;
  login(profile: AuthProfile): void;
  logout(): void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      profile: null,
      login: (profile) => set({ profile }),
      logout: () => set({ profile: null }),
    }),
    {
      name: "cineverse.auth.v1",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

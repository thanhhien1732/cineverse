"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StaffProfile } from "@/types/domain";

interface StaffStore {
  readonly hasHydrated: boolean;
  readonly profile: StaffProfile | null;
  setHasHydrated(hasHydrated: boolean): void;
  signIn(profile: StaffProfile): void;
  signOut(): void;
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      profile: null,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      signIn: (profile) => set({ profile }),
      signOut: () => set({ profile: null }),
    }),
    {
      name: "cineverse.staff-session.v1",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

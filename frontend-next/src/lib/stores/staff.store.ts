"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StaffProfile } from "@/types/domain";

interface StaffStore {
  readonly profile: StaffProfile | null;
  signIn(profile: StaffProfile): void;
  signOut(): void;
}
export const useStaffStore = create<StaffStore>()(
  persist(
    (set) => ({
      profile: null,
      signIn: (profile) => set({ profile }),
      signOut: () => set({ profile: null }),
    }),
    {
      name: "cineverse.staff-session.v1",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

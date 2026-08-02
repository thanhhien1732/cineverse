"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BookingDraft } from "@/types/domain";
import type { Ticket } from "@/types/domain";

interface BookingStore extends BookingDraft {
  selectMovie(movieId: string): void;
  selectShowtime(showtimeId: string): void;
  toggleSeat(seatId: string): void;
  setComboQuantity(comboId: string, quantity: number): void;
  setCheckoutConfirmation(field: "acceptedTerms" | "confirmedAgeEligibility", value: boolean): void;
  clearBooking(): void;
  ticket: Ticket | null;
  issueTicket(ticket: Ticket): void;
}

const initialBookingDraft: BookingDraft = {
  movieId: null,
  showtimeId: null,
  seatIds: [],
  comboQuantities: {},
  acceptedTerms: false,
  confirmedAgeEligibility: false,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      ...initialBookingDraft,
      selectMovie: (movieId) =>
        set({
          movieId,
          showtimeId: null,
          seatIds: [],
          comboQuantities: {},
          acceptedTerms: false,
          confirmedAgeEligibility: false,
        }),
      selectShowtime: (showtimeId) => set({ showtimeId, seatIds: [] }),
      toggleSeat: (seatId) =>
        set((state) => ({
          seatIds: state.seatIds.includes(seatId)
            ? state.seatIds.filter((selectedSeatId) => selectedSeatId !== seatId)
            : [...state.seatIds, seatId],
        })),
      setComboQuantity: (comboId, quantity) =>
        set((state) => {
          const normalizedQuantity = Math.max(0, Math.trunc(quantity));
          const comboQuantities = { ...state.comboQuantities };

          if (normalizedQuantity === 0) {
            delete comboQuantities[comboId];
          } else {
            comboQuantities[comboId] = normalizedQuantity;
          }

          return { comboQuantities };
        }),
      setCheckoutConfirmation: (field, value) => set({ [field]: value }),
      clearBooking: () => set(initialBookingDraft),
      ticket: null,
      issueTicket: (ticket) => set({ ticket }),
    }),
    {
      name: "cineverse.booking-draft.v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        movieId: state.movieId,
        showtimeId: state.showtimeId,
        seatIds: state.seatIds,
        comboQuantities: state.comboQuantities,
        acceptedTerms: state.acceptedTerms,
        confirmedAgeEligibility: state.confirmedAgeEligibility,
        ticket: state.ticket,
      }),
    },
  ),
);

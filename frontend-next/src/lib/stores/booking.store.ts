"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BookingDraft, Ticket, TicketStatus } from "@/types/domain";

interface BookingStore extends BookingDraft {
  readonly tickets: readonly Ticket[];
  selectMovie(movieId: string): void;
  selectShowtime(showtimeId: string): void;
  toggleSeat(seatId: string): void;
  clearSeats(): void;
  setComboQuantity(comboId: string, quantity: number): void;
  setCheckoutConfirmation(
    field: "acceptedTerms" | "confirmedAgeEligibility",
    value: boolean,
  ): void;
  issueTicket(ticket: Ticket): void;
  markTicket(ticketId: string, status: TicketStatus): void;
  clearBooking(): void;
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
      tickets: [],
      selectMovie: (movieId) => set({ ...initialBookingDraft, movieId }),
      selectShowtime: (showtimeId) =>
        set({
          showtimeId,
          seatIds: [],
          comboQuantities: {},
          acceptedTerms: false,
          confirmedAgeEligibility: false,
        }),
      toggleSeat: (seatId) =>
        set((state) => ({
          seatIds: state.seatIds.includes(seatId)
            ? state.seatIds.filter((id) => id !== seatId)
            : [...state.seatIds, seatId],
        })),
      clearSeats: () => set({ seatIds: [] }),
      setComboQuantity: (comboId, quantity) =>
        set((state) => {
          const next = { ...state.comboQuantities };
          const normalized = Math.max(0, Math.trunc(quantity));
          if (normalized) next[comboId] = normalized;
          else delete next[comboId];
          return { comboQuantities: next };
        }),
      setCheckoutConfirmation: (field, value) => set({ [field]: value }),
      issueTicket: (ticket) =>
        set((state) => ({ tickets: [ticket, ...state.tickets] })),
      markTicket: (ticketId, status) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status } : ticket,
          ),
        })),
      clearBooking: () => set(initialBookingDraft),
    }),
    {
      name: "cineverse.booking-draft.v2",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        ...initialBookingDraft,
        movieId: state.movieId,
        showtimeId: state.showtimeId,
        seatIds: state.seatIds,
        comboQuantities: state.comboQuantities,
        acceptedTerms: state.acceptedTerms,
        confirmedAgeEligibility: state.confirmedAgeEligibility,
        tickets: state.tickets,
      }),
    },
  ),
);

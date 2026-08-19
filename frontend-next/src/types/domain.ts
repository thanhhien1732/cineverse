export type MovieStatus = "coming-soon" | "now-showing";

export interface Movie {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: MovieStatus;
  readonly durationMinutes: number;
  readonly releaseLabel: string;
  readonly ratingLabel: string;
  readonly scoreLabel: string;
  readonly languageLabel?: string;
  readonly accentColor: string;
  readonly genres: readonly string[];
  readonly formats: readonly string[];
  readonly tagline: string;
  readonly description: string;
  readonly posterPath: string;
  readonly backdropPath: string;
  /** Mã nhúng <iframe> YouTube dán từ trang admin. */
  readonly trailerEmbedCode?: string;
}

export interface Cinema {
  readonly id: string;
  readonly name: string;
  readonly areaName: string;
  readonly address?: string;
  readonly features?: readonly string[];
}

export interface Showtime {
  readonly id: string;
  readonly movieId: Movie["id"];
  readonly cinemaId: Cinema["id"];
  readonly startsAt: string;
  readonly format: string;
  readonly basePrice: number;
}

export interface Seat {
  readonly id: string;
  readonly label: string;
  readonly kind: "couple" | "standard" | "vip";
  readonly priceMultiplier: number;
}

export interface Combo {
  readonly id: string;
  readonly name: string;
  readonly unitPrice: number;
  readonly description?: string;
  readonly imagePath?: string;
  readonly badge?: string;
}

export type TicketStatus = "valid" | "used" | "invalid";

export interface Ticket {
  readonly id: string;
  readonly code: string;
  readonly movieTitle: string;
  readonly showtimeId: string;
  readonly seatLabels: readonly string[];
  readonly comboQuantities: Readonly<Record<string, number>>;
  readonly total: number;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly createdAt: string;
  readonly status: TicketStatus;
}

export interface StaffProfile {
  readonly fullName: string;
  readonly email: string;
  readonly role: "gate-control-admin";
}

export interface BookingDraft {
  readonly movieId: string | null;
  readonly showtimeId: string | null;
  readonly seatIds: readonly string[];
  readonly comboQuantities: Readonly<Record<string, number>>;
  readonly acceptedTerms: boolean;
  readonly confirmedAgeEligibility: boolean;
}

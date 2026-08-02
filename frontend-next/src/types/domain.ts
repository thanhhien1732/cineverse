export type MovieStatus = "coming-soon" | "now-showing";

export interface Movie {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: MovieStatus;
  readonly durationMinutes: number;
  readonly ratingLabel: string;
  readonly genres: readonly string[];
  readonly formats: readonly string[];
  readonly tagline: string;
  readonly description: string;
  readonly posterPath: string;
  readonly backdropPath: string;
  readonly trailerPath?: string;
}

export interface Cinema {
  readonly id: string;
  readonly name: string;
  readonly areaName: string;
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
}

export interface BookingDraft {
  readonly movieId: string | null;
  readonly showtimeId: string | null;
  readonly seatIds: readonly string[];
  readonly comboQuantities: Readonly<Record<string, number>>;
  readonly acceptedTerms: boolean;
  readonly confirmedAgeEligibility: boolean;
}

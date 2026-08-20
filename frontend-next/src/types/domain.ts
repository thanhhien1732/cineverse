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

/** Thương hiệu rạp (CGV, Lotte, Galaxy…) mà Cineverse tổng hợp vé. */
export interface CinemaBrand {
  readonly id: string;
  readonly name: string;
  /** Tên rút gọn cho tile chọn rạp — phải luôn vừa một hàng. */
  readonly shortName: string;
  readonly logoPath: string;
}

export interface Cinema {
  readonly id: string;
  readonly brandId: CinemaBrand["id"];
  readonly name: string;
  readonly areaName: string;
  readonly cityName: string;
  readonly address?: string;
  readonly features?: readonly string[];
  readonly latitude: number;
  readonly longitude: number;
}

/** Phụ đề hay lồng tiếng — dùng để gom nhóm suất chiếu. */
export type ShowtimeAudioMode = "dubbed" | "subtitled";

export interface Showtime {
  readonly id: string;
  readonly movieId: Movie["id"];
  readonly cinemaId: Cinema["id"];
  readonly startsAt: string;
  readonly format: string;
  readonly audioMode: ShowtimeAudioMode;
  readonly hall: string;
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
  /** Số điểm CINEVERSE đã dùng cho đơn hàng này. */
  readonly pointsRedeemed?: number;
  /** Voucher sinh nhật đã dùng, để ví hội viên không tính lại. */
  readonly voucherId?: string;
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

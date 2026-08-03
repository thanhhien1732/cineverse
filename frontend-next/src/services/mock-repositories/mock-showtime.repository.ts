import type { Cinema, Showtime } from "@/types/domain";
import type { ShowtimeRepository } from "@/types/repositories";

const cinemas: readonly Cinema[] = [
  {
    id: "landmark-81",
    name: "CINEVERSE Landmark 81",
    areaName: "Ho Chi Minh City",
    address: "208 Nguyen Huu Canh, Binh Thanh",
    features: ["IMAX", "4DX", "Dolby Atmos"],
  },
  {
    id: "vincom-center",
    name: "CINEVERSE Vincom Center",
    areaName: "Ho Chi Minh City",
    address: "72 Le Thanh Ton, District 1",
    features: ["ScreenX", "Dolby Atmos"],
  },
  {
    id: "crescent-mall",
    name: "CINEVERSE Crescent Mall",
    areaName: "Ho Chi Minh City",
    address: "101 Ton Dat Tien, District 7",
    features: ["4DX", "Couple Seats"],
  },
  {
    id: "aeon-tan-phu",
    name: "CINEVERSE AEON Tan Phu",
    areaName: "Ho Chi Minh City",
    address: "30 Bo Bao Tan Thang, Tan Phu",
    features: ["Family Hall", "Couple Seats"],
  },
];

const showtimes: readonly Showtime[] = [
  {
    id: "showtime-minions-l81-1800",
    movieId: "minions-monsters",
    cinemaId: "landmark-81",
    startsAt: "2026-08-03T18:00:00+07:00",
    format: "IMAX",
    basePrice: 125000,
  },
  {
    id: "showtime-minions-vincom-2030",
    movieId: "minions-monsters",
    cinemaId: "vincom-center",
    startsAt: "2026-08-03T20:30:00+07:00",
    format: "2D",
    basePrice: 95000,
  },
  {
    id: "showtime-mario-l81-1930",
    movieId: "super-mario-galaxy",
    cinemaId: "landmark-81",
    startsAt: "2026-08-03T19:30:00+07:00",
    format: "4DX",
    basePrice: 140000,
  },
  {
    id: "showtime-reminders-crescent-1815",
    movieId: "reminders-of-him",
    cinemaId: "crescent-mall",
    startsAt: "2026-08-04T18:15:00+07:00",
    format: "Premium",
    basePrice: 115000,
  },
  {
    id: "showtime-disclosure-vincom-2100",
    movieId: "disclosure-day",
    cinemaId: "vincom-center",
    startsAt: "2026-08-04T21:00:00+07:00",
    format: "IMAX",
    basePrice: 130000,
  },
];

export const mockShowtimeRepository: ShowtimeRepository = {
  async findCinemas() {
    return cinemas;
  },

  async findShowtimesByMovie(movieId) {
    return showtimes.filter((showtime) => showtime.movieId === movieId);
  },
};

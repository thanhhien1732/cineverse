import type { Cinema, Showtime } from "@/types/domain";
import type { ShowtimeRepository } from "@/types/repositories";

const cinemas: readonly Cinema[] = [
  { id: "cineverse-district-1", name: "Cineverse District 1", areaName: "Ho Chi Minh City" },
];

const showtimes: readonly Showtime[] = [
  {
    id: "showtime-minions-d1-1800",
    movieId: "minions-monsters",
    cinemaId: "cineverse-district-1",
    startsAt: "2026-08-03T18:00:00+07:00",
    format: "2D",
    basePrice: 90000,
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

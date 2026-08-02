import type { Cinema, Movie, Showtime } from "@/types/domain";

export interface CatalogueRepository {
  findAllMovies(): Promise<readonly Movie[]>;
  findMovieById(id: string): Promise<Movie | null>;
  findMovieBySlug(slug: string): Promise<Movie | null>;
}

export interface ShowtimeRepository {
  findCinemas(): Promise<readonly Cinema[]>;
  findShowtimesByMovie(movieId: string): Promise<readonly Showtime[]>;
}

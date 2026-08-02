import type { Movie } from "@/types/domain";
import type { CatalogueRepository } from "@/types/repositories";

const movies: readonly Movie[] = [
  {
    id: "minions-monsters",
    slug: "minions-monsters",
    title: "Minions & Monsters",
    status: "now-showing",
    durationMinutes: 104,
    ratingLabel: "P",
    genres: ["Animation", "Family", "Comedy"],
    posterPath: "/assets/media/posters/minions-monsters.webp",
  },
  {
    id: "disclosure-day",
    slug: "disclosure-day",
    title: "Disclosure Day",
    status: "coming-soon",
    durationMinutes: 126,
    ratingLabel: "T13",
    genres: ["Sci-Fi", "Thriller", "Drama"],
    posterPath: "/assets/media/posters/disclosure-day.webp",
  },
];

export const mockCatalogueRepository: CatalogueRepository = {
  async findAllMovies() {
    return movies;
  },

  async findMovieBySlug(slug) {
    return movies.find((movie) => movie.slug === slug) ?? null;
  },
};

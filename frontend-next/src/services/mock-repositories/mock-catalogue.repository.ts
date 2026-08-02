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
    formats: ["2D", "IMAX", "4DX"],
    tagline: "Một đội quân tí hon, một cuộc phiêu lưu khổng lồ.",
    description: "Một tín hiệu bí ẩn đưa biệt đội Minions vào hành trình mới, nơi tinh thần đồng đội là chìa khóa để trở về.",
    posterPath: "/assets/media/posters/minions-monsters.webp",
    backdropPath: "/assets/media/backdrops/minions-monsters.webp",
    trailerPath: "/assets/media/video/minions-monsters.webm",
  },
  {
    id: "super-mario-galaxy",
    slug: "super-mario-galaxy",
    title: "The Super Mario Galaxy Movie",
    status: "now-showing",
    durationMinutes: 112,
    ratingLabel: "K",
    genres: ["Animation", "Adventure", "Family"],
    formats: ["2D", "IMAX", "4DX"],
    tagline: "Một hành trình mới mở ra giữa các vì sao.",
    description: "Những người hùng quen thuộc bước vào một thế giới mới, đầy thử thách và những vì sao chưa từng được khám phá.",
    posterPath: "/assets/media/posters/super-mario-galaxy.webp",
    backdropPath: "/assets/media/backdrops/minions-monsters.webp",
  },
  {
    id: "reminders-of-him",
    slug: "reminders-of-him",
    title: "Reminders of Him",
    status: "now-showing",
    durationMinutes: 118,
    ratingLabel: "T13",
    genres: ["Drama", "Romance"],
    formats: ["2D", "Premium"],
    tagline: "Some memories ask for a second chance.",
    description: "Một hành trình trở về buộc con người phải đối diện với ký ức và cơ hội làm lại từ đầu.",
    posterPath: "/assets/media/posters/reminders-of-him.webp",
    backdropPath: "/assets/media/backdrops/minions-monsters.webp",
  },
  {
    id: "disclosure-day",
    slug: "disclosure-day",
    title: "Disclosure Day",
    status: "coming-soon",
    durationMinutes: 126,
    ratingLabel: "T13",
    genres: ["Sci-Fi", "Thriller", "Drama"],
    formats: ["2D", "IMAX"],
    tagline: "Chúng ta xứng đáng được biết sự thật.",
    description: "Một tín hiệu bất thường xuất hiện khắp thế giới, mở ra câu hỏi về sự thật đã bị che giấu.",
    posterPath: "/assets/media/posters/disclosure-day.webp",
    backdropPath: "/assets/media/backdrops/disclosure-day.webp",
  },
  {
    id: "the-odyssey",
    slug: "the-odyssey",
    title: "The Odyssey",
    status: "coming-soon",
    durationMinutes: 152,
    ratingLabel: "T13",
    genres: ["Adventure", "Drama", "Fantasy"],
    formats: ["2D", "IMAX"],
    tagline: "Cái giá của sự vĩ đại.",
    description: "Một thiên sử thi về hành trình trở về, những thử thách và ý chí sinh tồn.",
    posterPath: "/assets/media/posters/the-odyssey.webp",
    backdropPath: "/assets/media/backdrops/the-odyssey.webp",
  },
  {
    id: "forgotten-island",
    slug: "forgotten-island",
    title: "Forgotten Island",
    status: "coming-soon",
    durationMinutes: 121,
    ratingLabel: "T13",
    genres: ["Adventure", "Thriller", "Mystery"],
    formats: ["2D", "IMAX"],
    tagline: "Có những nơi bị xóa sổ hoàn toàn là có lý do.",
    description: "Một hòn đảo bị lãng quên đưa những người ghé thăm vào một bí ẩn không thể quay đầu.",
    posterPath: "/assets/media/posters/forgotten-island.webp",
    backdropPath: "/assets/media/backdrops/the-odyssey.webp",
  },
];

export const mockCatalogueRepository: CatalogueRepository = {
  async findAllMovies() {
    return movies;
  },

  async findMovieById(id) {
    return movies.find((movie) => movie.id === id) ?? null;
  },

  async findMovieBySlug(slug) {
    return movies.find((movie) => movie.slug === slug) ?? null;
  },
};

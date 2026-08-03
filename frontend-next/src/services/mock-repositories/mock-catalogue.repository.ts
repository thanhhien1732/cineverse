import type { Movie, MovieStatus } from "@/types/domain";
import type { CatalogueRepository } from "@/types/repositories";

type MovieFixture = Omit<
  Movie,
  | "slug"
  | "description"
  | "posterPath"
  | "backdropPath"
  | "trailerPath"
  | "releaseLabel"
> & {
  readonly poster: string;
  readonly backdrop: string;
  readonly trailer?: string;
};
const description =
  "Câu chuyện điện ảnh đưa khán giả vào một hành trình giàu cảm xúc, với những lựa chọn không thể đoán trước và một thế giới đáng để khám phá trên màn ảnh rộng.";
function movie(
  id: string,
  title: string,
  status: MovieStatus,
  durationMinutes: number,
  ratingLabel: string,
  genres: readonly string[],
  formats: readonly string[],
  tagline: string,
  backdropExtension = "webp",
): MovieFixture {
  return {
    id,
    title,
    status,
    durationMinutes,
    ratingLabel,
    genres,
    formats,
    tagline,
    poster: `/assets/media/posters/${id}.webp`,
    backdrop: `/assets/media/backdrops/${id}.${backdropExtension}`,
    trailer: `/assets/media/video/${id}.webm`,
  };
}
const fixtures: readonly MovieFixture[] = [
  movie(
    "minions-monsters",
    "Minions & Monsters",
    "now-showing",
    104,
    "P",
    ["Animation", "Family", "Comedy"],
    ["2D", "IMAX", "4DX"],
    "Từ một đội quân tí hon, đến một hành trình vĩ đại.",
  ),
  movie(
    "super-mario-galaxy",
    "The Super Mario Galaxy Movie",
    "now-showing",
    112,
    "K",
    ["Animation", "Adventure", "Family"],
    ["2D", "IMAX", "4DX"],
    "Một chuyến phiêu lưu mới mở ra giữa các vì sao.",
    "webp",
  ),
  movie(
    "reminders-of-him",
    "Reminders of Him",
    "now-showing",
    118,
    "T13",
    ["Drama", "Romance"],
    ["2D", "Premium"],
    "Some memories ask for a second chance.",
  ),
  movie(
    "you-me-tuscany",
    "You, Me and Tuscany",
    "now-showing",
    108,
    "T13",
    ["Romance", "Comedy", "Drama"],
    ["2D", "Premium"],
    "Sometimes the detour becomes the destination.",
    "webp",
  ),
  movie(
    "disclosure-day",
    "Disclosure Day",
    "coming-soon",
    126,
    "T13",
    ["Sci-Fi", "Thriller", "Drama"],
    ["2D", "IMAX"],
    "Chúng ta xứng đáng được biết sự thật.",
  ),
  movie(
    "the-odyssey",
    "The Odyssey",
    "coming-soon",
    152,
    "T13",
    ["Adventure", "Drama", "Fantasy"],
    ["2D", "IMAX"],
    "Cái giá của sự vĩ đại.",
  ),
  movie(
    "forgotten-island",
    "Forgotten Island",
    "coming-soon",
    128,
    "T16",
    ["Adventure", "Thriller", "Mystery"],
    ["2D", "IMAX"],
    "Có những nơi bị xóa sổ hoàn toàn là có lý do.",
  ),
  movie(
    "focker-in-law",
    "Focker-In-Law",
    "coming-soon",
    114,
    "T13",
    ["Comedy", "Family"],
    ["2D"],
    "Family meetings are never simple.",
  ),
  movie(
    "one-night-only",
    "One Night Only",
    "coming-soon",
    110,
    "T16",
    ["Drama", "Thriller"],
    ["2D"],
    "One night can change every plan.",
  ),
  movie(
    "five-nights-at-freddys-2",
    "Five Nights at Freddy's 2",
    "coming-soon",
    112,
    "T18",
    ["Horror", "Thriller"],
    ["2D"],
    "The night shift is not over.",
  ),
  movie(
    "wicked-for-good",
    "Wicked: For Good",
    "coming-soon",
    138,
    "T13",
    ["Fantasy", "Musical", "Drama"],
    ["2D", "Premium"],
    "Every story leaves an echo.",
  ),
  movie(
    "black-phone-2",
    "Black Phone 2",
    "coming-soon",
    116,
    "T18",
    ["Horror", "Mystery", "Thriller"],
    ["2D"],
    "Some calls should never be answered.",
    "jpg",
  ),
];

const releaseLabels: Readonly<Record<string, string>> = {
  "minions-monsters": "01.07.2026",
  "super-mario-galaxy": "01.04.2026",
  "reminders-of-him": "13.03.2026",
  "you-me-tuscany": "10.04.2026",
  "disclosure-day": "03.07.2026",
  "the-odyssey": "17.07.2026",
  "forgotten-island": "25.09.2026",
  "focker-in-law": "25.11.2026",
  "one-night-only": "07.08.2026",
  "five-nights-at-freddys-2": "Sự kiện đặc biệt",
  "wicked-for-good": "Sự kiện đặc biệt",
  "black-phone-2": "Sự kiện đặc biệt",
};

const movies: readonly Movie[] = fixtures.map(
  ({ poster, backdrop, trailer, ...value }) => ({
    ...value,
    releaseLabel: releaseLabels[value.id] ?? "Đang cập nhật",
    slug: value.id,
    description,
    posterPath: poster,
    backdropPath: backdrop,
    trailerPath: trailer,
  }),
);
export const mockCatalogueRepository: CatalogueRepository = {
  async findAllMovies() {
    return movies;
  },
  async findMovieById(id) {
    return movies.find((item) => item.id === id) ?? null;
  },
  async findMovieBySlug(slug) {
    return movies.find((item) => item.slug === slug) ?? null;
  },
};

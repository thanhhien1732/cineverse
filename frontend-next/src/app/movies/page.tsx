import { MovieFilters } from "@/components/movies/movie-filters";
import { mockCatalogueRepository } from "@/services/mock-repositories";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, movies] = await Promise.all([
    searchParams,
    mockCatalogueRepository.findAllMovies(),
  ]);
  return (
    <section className="mx-auto w-full max-w-340 px-page py-section">
      <div className="mb-24 flex max-w-3xl flex-col gap-3">
        <p className="text-xs font-bold tracking-widest text-cv-primary-bright uppercase">
          Khám Phá CINEVERSE
        </p>
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl uppercase">
          Danh sách phim
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Tìm kiếm bộ phim phù hợp với bạn, xem thông tin chi tiết và bắt đầu
          đặt vé chỉ trong vài bước.
        </p>
      </div>
      <MovieFilters initialQuery={q ?? ""} movies={movies} />
    </section>
  );
}

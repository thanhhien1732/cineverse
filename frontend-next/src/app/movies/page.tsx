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
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <p className="text-xs font-bold tracking-[0.24em] text-primary-bright">
          MOVIE CATALOGUE
        </p>
        <h1 className="text-5xl font-black tracking-[-0.08em] sm:text-6xl">
          Chọn màn ảnh của bạn.
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Duyệt phim theo cảm xúc, thể loại hoặc định dạng bạn muốn xem.
        </p>
      </div>
      <MovieFilters initialQuery={q ?? ""} movies={movies} />
    </section>
  );
}

import { ShowtimePicker } from "@/components/booking/booking-flow";
import {
  mockCatalogueRepository,
  mockComboRepository,
  mockShowtimeRepository,
} from "@/services/mock-repositories";
export default async function Page() {
  const [movies, cinemas, combos] = await Promise.all([
    mockCatalogueRepository.findAllMovies(),
    mockShowtimeRepository.findCinemas(),
    mockComboRepository.findAllCombos(),
  ]);
  const showtimes = (
    await Promise.all(
      movies.map((movie) =>
        mockShowtimeRepository.findShowtimesByMovie(movie.id),
      ),
    )
  ).flat();
  return (
    <section className="mx-auto max-w-340 px-page py-section">
      <p className="text-xs font-bold tracking-[.2em] text-cv-primary-bright uppercase">
        Đặt vé
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase">Chọn suất chiếu</h1>
      <p className="mt-4 text-muted-foreground">
        Chọn phim, ngày chiếu và rạp phù hợp với lịch trình của bạn.
      </p>
      <div className="mt-10">
        <ShowtimePicker
          movies={movies}
          cinemas={cinemas}
          showtimes={showtimes}
          combos={combos}
        />
      </div>
    </section>
  );
}

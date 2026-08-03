import { Checkout } from "@/components/booking/booking-flow";
import {
  mockCatalogueRepository,
  mockComboRepository,
  mockShowtimeRepository,
} from "@/services/mock-repositories";
export default async function Page() {
  const [movies, combos] = await Promise.all([
    mockCatalogueRepository.findAllMovies(),
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
    <section className="mx-auto max-w-[85rem] px-page py-section">
      <h1 className="text-4xl font-black">Xác nhận đặt vé</h1>
      <div className="mt-8">
        <Checkout movies={movies} showtimes={showtimes} combos={combos} />
      </div>
    </section>
  );
}

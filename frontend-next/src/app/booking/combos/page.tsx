import { ComboPicker } from "@/components/booking/booking-flow";
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
  return (
    <section className="mx-auto max-w-340 px-page py-section">
      <h1 className="text-4xl font-black">Thêm combo yêu thích</h1>
      <div className="mt-8">
        <ComboPicker movies={movies} cinemas={cinemas} combos={combos} />
      </div>
    </section>
  );
}

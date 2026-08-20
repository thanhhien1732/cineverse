import { SeatPicker } from "@/components/booking/seat-picker";
import {
  mockCatalogueRepository,
  mockComboRepository,
  mockShowtimeRepository,
} from "@/services/mock-repositories";
export default async function Page({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  await params;
  const [movies, cinemas, combos] = await Promise.all([
    mockCatalogueRepository.findAllMovies(),
    mockShowtimeRepository.findCinemas(),
    mockComboRepository.findAllCombos(),
  ]);
  return (
    <section className="mx-auto max-w-340 px-page py-section">
      <h1 className="text-4xl font-black uppercase">Chọn ghế</h1>
      <div className="mt-8">
        <SeatPicker movies={movies} cinemas={cinemas} combos={combos} />
      </div>
    </section>
  );
}

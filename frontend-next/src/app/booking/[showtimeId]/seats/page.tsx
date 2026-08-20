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
      <p className="text-xs font-bold tracking-[.2em] text-cv-primary-bright uppercase">
        Đặt vé
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase">Chọn ghế</h1>
      <p className="mt-4 text-muted-foreground">
        Chọn vị trí ngồi phù hợp cho suất chiếu bạn vừa chọn.
      </p>
      <div className="mt-10">
        <SeatPicker movies={movies} cinemas={cinemas} combos={combos} />
      </div>
    </section>
  );
}

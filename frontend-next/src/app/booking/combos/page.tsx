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
      <p className="text-xs font-bold tracking-[.2em] text-cv-primary-bright uppercase">
        Đặt vé
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase">Thêm combo yêu thích</h1>
      <p className="mt-4 text-muted-foreground">
        Chọn bắp rang, nước uống và món ăn nhẹ hoặc bỏ qua để thanh toán ngay.
      </p>
      <div className="mt-10">
        <ComboPicker movies={movies} cinemas={cinemas} combos={combos} />
      </div>
    </section>
  );
}

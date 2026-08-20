import { CheckoutForm } from "@/components/booking/checkout-form";
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
      <h1 className="mt-3 text-5xl font-black uppercase">Xác nhận đặt vé</h1>
      <p className="mt-4 text-muted-foreground">
        Kiểm tra thông tin đơn hàng và hoàn tất thanh toán.
      </p>
      <div className="mt-10">
        <CheckoutForm movies={movies} cinemas={cinemas} combos={combos} />
      </div>
    </section>
  );
}

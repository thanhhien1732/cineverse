import Link from "next/link";
import { ShowtimePicker } from "@/components/booking/booking-flow";
import { Button } from "@/components/ui/button";
import { upcomingBookingDates } from "@/lib/showtime-schedule";
import {
  mockCatalogueRepository,
  mockShowtimeRepository,
} from "@/services/mock-repositories";

function PageShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-340 px-page py-section">
      <p className="text-xs font-bold tracking-[.2em] text-cv-primary-bright uppercase">
        Đặt vé
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase">Chọn suất chiếu</h1>
      <p className="mt-4 text-muted-foreground">{subtitle}</p>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ movie?: string }>;
}) {
  const { movie: movieId } = await searchParams;
  const movie = movieId
    ? await mockCatalogueRepository.findMovieById(movieId)
    : null;

  /** Phim được chọn từ trang chủ hoặc trang danh sách phim trước khi tới đây. */
  if (!movie || movie.status !== "now-showing") {
    return (
      <PageShell subtitle="Hãy chọn phim bạn muốn xem trước khi đặt vé.">
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-lg font-bold">Chưa chọn phim</p>
          <p className="mt-2 text-muted-foreground">
            Chọn một phim đang chiếu để xem ngày, rạp và suất chiếu phù hợp.
          </p>
          <Link className="mt-6 inline-block" href="/movies">
            <Button>Xem phim đang chiếu</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const [brands, cinemas] = await Promise.all([
    mockShowtimeRepository.findBrands(),
    mockShowtimeRepository.findCinemas(),
  ]);

  return (
    <PageShell subtitle="Chọn ngày chiếu và rạp phù hợp với lịch trình của bạn.">
      <ShowtimePicker
        movie={movie}
        brands={brands}
        cinemas={cinemas}
        dates={upcomingBookingDates()}
      />
    </PageShell>
  );
}

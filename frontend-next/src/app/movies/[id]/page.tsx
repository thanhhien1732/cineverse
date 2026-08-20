import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookingDateAt } from "@/lib/showtime-schedule";
import type { CSSProperties } from "react";
import {
  ArrowRightIcon,
  Clock3Icon,
  ClockIcon,
  ClapperboardIcon,
  StarIcon,
  TicketIcon,
} from "lucide-react";
import { RelatedMovieCard } from "@/components/movies/related-movie-card";
import { Button } from "@/components/ui/button";
import { TrailerDialog } from "@/components/movies/trailer-dialog";
import { formatDuration } from "@/lib/utils";
import {
  mockCatalogueRepository,
  mockShowtimeRepository,
} from "@/services/mock-repositories";
export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await mockCatalogueRepository.findMovieById(id);
  if (!movie) notFound();
  const [movies, cinemas, allShowtimes] = await Promise.all([
    mockCatalogueRepository.findAllMovies(),
    mockShowtimeRepository.findCinemas(),
    mockShowtimeRepository.findShowtimesByMovie(movie.id),
  ]);
  /** Chỉ xem trước vài suất gần nhất trong hôm nay, xem đủ ở trang đặt vé. */
  const showtimes = allShowtimes
    .filter((showtime) => showtime.startsAt.startsWith(bookingDateAt(0)))
    .slice(0, 6);
  const others = movies.filter((item) => item.id !== movie.id);
  const sameGenre = others.filter((item) =>
    item.genres.some((genre) => movie.genres.includes(genre)),
  );
  const rest = others.filter((item) => !sameGenre.includes(item));
  const related = [...sameGenre, ...rest].slice(0, 4);
  return (
    <>
      <section
        className="relative isolate overflow-hidden border-b border-border"
        style={{ "--hero-accent": movie.accentColor } as CSSProperties}
      >
        <Image
          alt=""
          aria-hidden
          className="-z-20 object-cover opacity-35"
          fill
          priority
          sizes="100vw"
          src={movie.backdropPath}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_10%,rgb(5_7_13/82%)_56%,rgb(5_7_13/30%)_100%)]" />
        <div className="detail-layout mx-auto w-full max-w-340 px-page">
          <div className="detail-poster">
            <Image
              alt={`Poster ${movie.title}`}
              fill
              priority
              sizes="(max-width: 680px) 8.75rem, (max-width: 920px) 11.875rem, 17.5rem"
              src={movie.posterPath}
            />
            <span>{movie.ratingLabel}</span>
          </div>
          <div className="detail-content">
            <p className="eyebrow">
              {movie.status === "now-showing" ? "NOW SHOWING" : "COMING SOON"}
            </p>
            <h1>{movie.title}</h1>
            <p className="detail-tagline">{movie.tagline}</p>
            <div className="detail-meta">
              <span>
                <StarIcon aria-hidden="true" className="size-4" />
                {movie.scoreLabel}
              </span>
              <span>
                <ClockIcon aria-hidden="true" className="size-4" />
                {formatDuration(movie.durationMinutes)}
              </span>
              {movie.languageLabel ? <span>{movie.languageLabel}</span> : null}
            </div>
            <div className="genre-list">
              {movie.genres.map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
            <div className="home-hero-actions">
              {movie.status === "now-showing" ? (
                <Link
                  className="home-primary-button"
                  href={`/showtimes?movie=${movie.id}`}
                >
                  Đặt vé ngay
                  <TicketIcon aria-hidden="true" />
                </Link>
              ) : (
                <span className="home-primary-button home-muted-button">
                  Sắp mở bán vé
                </span>
              )}
              <TrailerDialog
                movie={movie}
                showDetailLink={false}
                triggerClassName="home-ghost-button"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-340 gap-12 px-page py-section lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h2 className="text-3xl font-black">Về bộ phim</h2>
          <p className="mt-5 text-lg leading-8 text-foreground-muted">
            {movie.description}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <Clock3Icon className="mb-3 size-5 text-primary-bright" />
              <p className="text-sm text-muted-foreground">Khởi chiếu</p>
              <p className="font-semibold">{movie.releaseLabel}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <ClapperboardIcon className="mb-3 size-5 text-primary-bright" />
              <p className="text-sm text-muted-foreground">Định dạng</p>
              <p className="font-semibold">{movie.formats.join(" · ")}</p>
            </div>
          </div>
        </div>
        <aside className="rounded-xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-[.2em] text-primary-bright">
            SHOWTIMES
          </p>
          <h2 className="mt-2 text-2xl font-black">Suất chiếu sơ bộ</h2>
          <div className="mt-5 grid gap-3">
            {showtimes.length ? (
              showtimes.map((showtime) => (
                <div
                  key={showtime.id}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="font-semibold">
                    {
                      cinemas.find((cinema) => cinema.id === showtime.cinemaId)
                        ?.name
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(showtime.startsAt))}{" "}
                    · {showtime.format}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Suất chiếu đang được cập nhật.
              </p>
            )}
            {movie.status === "now-showing" ? (
              <Link href={`/showtimes?movie=${movie.id}`}>
                <Button className="gap-2 transition-transform hover:-translate-y-0.5">
                  Chọn suất chiếu
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <Button className="w-fit gap-2" disabled>
                Chọn suất chiếu
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            )}
          </div>
        </aside>
      </section>
      <section className="border-t border-border bg-surface/50">
        <div className="mx-auto w-full max-w-340 px-page py-section">
          <div className="home-section-head">
            <div>
              <p className="eyebrow">TIẾP TỤC KHÁM PHÁ</p>
              <h2>Có thể bạn quan tâm</h2>
            </div>
            <Link className="home-text-link" href="/movies">
              Tất cả phim
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>
          <div className="related-grid">
            {related.map((item) => (
              <RelatedMovieCard key={item.id} movie={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

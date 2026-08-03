import Link from "next/link";

import { MovieCard } from "@/components/movies/movie-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockCatalogueRepository } from "@/services/mock-repositories";
import { HeroSwitcher } from "@/components/movies/hero-switcher";

export default async function HomePage() {
  const movies = await mockCatalogueRepository.findAllMovies();
  const nowShowing = movies.filter((movie) => movie.status === "now-showing");
  const comingSoon = movies.filter((movie) => movie.status === "coming-soon");

  return (
    <>
      <HeroSwitcher
        movies={movies.filter((movie) => movie.status === "now-showing")}
      />

      <section className="mx-auto w-full max-w-340 px-page py-section">
        <SectionHeading
          eyebrow="NOW SHOWING"
          title="Đang chiếu tại Cineverse"
          href="/movies?status=now-showing"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {nowShowing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/70">
        <div className="mx-auto w-full max-w-340 px-page py-section">
          <SectionHeading
            eyebrow="COMING SOON"
            title="Sắp ra mắt"
            href="/movies?status=coming-soon"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {comingSoon.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-340 px-page py-section">
        <div
          className="relative overflow-hidden rounded-2xl border border-primary/35 bg-surface px-6 py-12 sm:px-12"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(12 17 29 / 95%), rgb(12 17 29 / 65%)), url('/assets/media/static/newsletter-bg.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex max-w-xl flex-col gap-5">
            <p className="text-xs font-bold tracking-[0.24em] text-primary-bright">
              CINEVERSE LETTER
            </p>
            <h2 className="text-3xl font-black tracking-[-0.06em] sm:text-5xl">
              Biết trước suất chiếu đáng chờ.
            </h2>
            <p className="text-foreground-muted">
              Một email mỗi tuần về phim mới, suất đặc biệt và những đêm chiếu
              không nên bỏ lỡ.
            </p>
            <form className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="newsletter-email">
                Email
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="email@cuaban.com"
              />
              <Button type="submit">Đăng ký</Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  href,
  title,
}: {
  eyebrow: string;
  href: string;
  title: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-[0.22em] text-primary-bright">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-black tracking-[-0.06em] sm:text-4xl">
          {title}
        </h2>
      </div>
      <Link
        className="hidden text-sm font-semibold text-primary-bright hover:text-foreground sm:block"
        href={href}
      >
        Xem tất cả →
      </Link>
    </div>
  );
}

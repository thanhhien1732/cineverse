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
      {/*
      <section className="relative isolate overflow-hidden border-b border-border">
        <Image alt="" aria-hidden className="-z-20 object-cover opacity-45" fill priority sizes="100vw" src={featuredMovie.backdropPath} />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_5%,rgb(5_7_13/72%)_47%,rgb(5_7_13/18%)_100%)]" />
        <div className="mx-auto flex min-h-[34rem] w-full max-w-[85rem] items-end px-page py-section md:items-center">
          <div className="flex max-w-2xl flex-col gap-6">
            <p className="text-xs font-bold tracking-[0.24em] text-primary-bright">FEATURED PRESENTATION</p>
            <h1 className="max-w-xl text-5xl font-black leading-[0.88] tracking-[-0.08em] text-balance sm:text-7xl">{featuredMovie.title}</h1>
            <p className="max-w-lg text-lg leading-8 text-foreground-muted">{featuredMovie.tagline}</p>
            <div className="flex flex-wrap gap-3 text-sm text-foreground-muted"><span>{featuredMovie.ratingLabel}</span><span>·</span><span>{featuredMovie.durationMinutes} phút</span><span>·</span><span>{featuredMovie.formats.join(" · ")}</span></div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/movies/${featuredMovie.id}`} className={buttonVariants({ size: "lg" })}>Khám phá phim <ArrowRightIcon data-icon="inline-end" /></Link>
              <Link href="/movies" className={buttonVariants({ variant: "outline", size: "lg" })}><CalendarDaysIcon data-icon="inline-start" />Xem lịch phim</Link>
            </div>
          </div>
        </div>
      </section> */}
      <section className="mx-auto w-full max-w-[85rem] px-page py-section">
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
        <div className="mx-auto w-full max-w-[85rem] px-page py-section">
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
      <section className="mx-auto w-full max-w-[85rem] px-page py-section">
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

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon, PlayIcon } from "lucide-react";
import type { Movie } from "@/types/domain";

export function HomeMovieCard({
  compact = false,
  movie,
}: {
  readonly compact?: boolean;
  readonly movie: Movie;
}) {
  return (
    <article className={`home-movie-card${compact ? " is-compact" : ""}`}>
      <Link
        aria-label={`Mở chi tiết ${movie.title}`}
        className="home-movie-card-image"
        href={`/movies/${movie.id}`}
      >
        <Image
          alt={`Poster phim ${movie.title}`}
          fill
          sizes="(max-width: 680px) 41vw, (max-width: 920px) 50vw, 25vw"
          src={movie.posterPath}
        />
        <span className="home-movie-rating">{movie.ratingLabel}</span>
        <span className="home-movie-overlay" aria-hidden="true">
          <span>
            <PlayIcon className="size-[1.125rem] fill-current" />
          </span>
        </span>
      </Link>
      <div className="home-movie-card-body">
        <p className="eyebrow">{movie.genres.join(" · ")}</p>
        <h3>
          <Link href={`/movies/${movie.id}`}>{movie.title}</Link>
        </h3>
        <div className="home-movie-meta-row">
          <span>
            <ClockIcon aria-hidden="true" className="size-[0.9375rem]" />
            {movie.durationMinutes} phút
          </span>
          <span>{movie.formats.join(" · ")}</span>
        </div>
        <div className="home-card-actions">
          <Link className="home-text-link" href={`/movies/${movie.id}`}>
            Chi tiết
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

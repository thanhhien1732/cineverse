import Image from "next/image";
import Link from "next/link";
import { Clock3Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Movie } from "@/types/domain";

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}H ${remaining.toString().padStart(2, "0")}M`;
}

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group block focus-visible:outline-none"
    >
      <article className="overflow-hidden rounded-xl bg-card ring-1 ring-border transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary/70 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="relative aspect-2/3 overflow-hidden bg-surface-raised">
          <Image
            alt={`Poster ${movie.title}`}
            className="object-cover transition duration-500 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            src={movie.posterPath}
          />
          <Badge
            className="absolute left-3 top-3 bg-background/85 text-foreground"
            variant="outline"
          >
            {movie.status === "now-showing" ? "ĐANG CHIẾU" : "SẮP CHIẾU"}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-cv-primary-bright uppercase">
            {movie.genres.join(" · ")}
          </p>
          <h3 className="line-clamp-1 text-lg font-semibold text-foreground">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock3Icon aria-hidden className="size-4" />
              {formatDuration(movie.durationMinutes)}
            </span>
            <Badge variant="outline">{movie.ratingLabel}</Badge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {movie.tagline}
          </p>
        </div>
      </article>
    </Link>
  );
}

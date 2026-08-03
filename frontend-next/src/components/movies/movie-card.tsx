import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Movie } from "@/types/domain";

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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            src={movie.posterPath}
          />
          <Badge
            className="absolute left-3 top-3 bg-background/85 text-foreground"
            variant="outline"
          >
            {movie.ratingLabel}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary-bright">
            {movie.status === "now-showing" ? "ĐANG CHIẾU" : "SẮP CHIẾU"}
          </p>
          <h3 className="line-clamp-2 font-semibold text-foreground">
            {movie.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {movie.durationMinutes} phút · {movie.genres[0]}
          </p>
        </div>
      </article>
    </Link>
  );
}

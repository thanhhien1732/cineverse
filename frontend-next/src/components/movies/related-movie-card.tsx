import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/types/domain";

export function RelatedMovieCard({ movie }: { readonly movie: Movie }) {
  return (
    <Link className="related-card" href={`/movies/${movie.id}`}>
      <span className="related-card-image">
        <Image
          alt={`Poster ${movie.title}`}
          fill
          sizes="(max-width: 680px) 41vw, (max-width: 920px) 50vw, 20vw"
          src={movie.posterPath}
        />
      </span>
      <span className="related-card-body">
        <strong>{movie.title}</strong>
        <small>{movie.genres.join(" · ")}</small>
      </span>
    </Link>
  );
}

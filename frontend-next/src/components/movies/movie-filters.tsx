"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/movies/movie-card";
import type { Movie } from "@/types/domain";

type StatusFilter = "all" | Movie["status"];

export function MovieFilters({
  initialQuery,
  movies,
}: {
  initialQuery: string;
  movies: readonly Movie[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [genre, setGenre] = useState("all");
  const [format, setFormat] = useState("all");
  const genres = useMemo(
    () => [...new Set(movies.flatMap((movie) => movie.genres))],
    [movies],
  );
  const formats = useMemo(
    () => [...new Set(movies.flatMap((movie) => movie.formats))],
    [movies],
  );
  const filteredMovies = useMemo(
    () =>
      movies.filter((movie) => {
        const searchable =
          `${movie.title} ${movie.genres.join(" ")}`.toLocaleLowerCase("vi");
        return (
          (status === "all" || movie.status === status) &&
          (genre === "all" || movie.genres.includes(genre)) &&
          (format === "all" || movie.formats.includes(format)) &&
          searchable.includes(query.trim().toLocaleLowerCase("vi"))
        );
      }),
    [format, genre, movies, query, status],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Tìm phim</span>
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên hoặc thể loại"
          />
        </label>
        <select
          aria-label="Lọc trạng thái"
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="now-showing">Đang chiếu</option>
          <option value="coming-soon">Sắp chiếu</option>
        </select>
        <select
          aria-label="Lọc thể loại"
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm"
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
        >
          <option value="all">Mọi thể loại</option>
          {genres.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Lọc định dạng"
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm"
          value={format}
          onChange={(event) => setFormat(event.target.value)}
        >
          <option value="all">Mọi định dạng</option>
          {formats.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted-foreground">
        Hiển thị {filteredMovies.length} phim phù hợp.
      </p>
      {filteredMovies.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-8">
          <p className="font-semibold">Không tìm thấy phim phù hợp.</p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setGenre("all");
              setFormat("all");
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movies/movie-card";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types/domain";

type StatusFilter = "all" | Movie["status"];

const statusTabs = [
  ["all", "Tất cả"],
  ["now-showing", "Đang chiếu"],
  ["coming-soon", "Sắp chiếu"],
] as const satisfies readonly (readonly [StatusFilter, string])[];

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
      <div className="catalog-tools">
        <div aria-label="Lọc theo trạng thái" className="filter-tabs">
          {statusTabs.map(([value, label]) => (
            <button
              key={value}
              className={cn("filter-tab", status === value && "is-active")}
              onClick={() => setStatus(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filter-boxes">
          <label className="filter-wrap">
            <span className="sr-only">Tìm phim</span>
            <span aria-hidden className="filter-search-icon">
              <SearchIcon className="size-full" strokeWidth={2.35} />
            </span>
            <input
              className="filter-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên phim hoặc thể loại"
              type="search"
              value={query}
            />
          </label>
          <div className="filter-select-wrap">
            <select
              aria-label="Lọc theo thể loại"
              className="filter-select"
              onChange={(event) => setGenre(event.target.value)}
              value={genre}
            >
              <option value="all">Tất cả thể loại</option>
              {genres.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <span aria-hidden className="filter-select-icon">
              <ChevronDownIcon className="size-full" strokeWidth={2.35} />
            </span>
          </div>
          <div className="filter-select-wrap">
            <select
              aria-label="Lọc theo định dạng"
              className="filter-select"
              onChange={(event) => setFormat(event.target.value)}
              value={format}
            >
              <option value="all">Tất cả định dạng</option>
              {formats.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <span aria-hidden className="filter-select-icon">
              <ChevronDownIcon className="size-full" strokeWidth={2.35} />
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Hiển thị {filteredMovies.length} phim phù hợp.
      </p>
      {filteredMovies.length ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
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

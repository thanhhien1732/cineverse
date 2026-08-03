"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, TicketIcon } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { TrailerDialog } from "@/components/movies/trailer-dialog";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/types/domain";

const heroAccents: Readonly<Record<string, string>> = {
  "minions-monsters": "#ffcf35",
  "super-mario-galaxy": "#66c8ff",
  "disclosure-day": "#70e1ff",
  "the-odyssey": "#e59a5b",
  "forgotten-island": "#76bc9c",
};

export function HeroSwitcher({
  movies,
}: {
  readonly movies: readonly Movie[];
}) {
  const items = useMemo(() => movies.slice(0, 5), [movies]);
  const [activeIndex, setActiveIndex] = useState(0);
  const movie = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (items.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % items.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!movie) {
    return null;
  }

  function setActive(nextIndex: number) {
    setActiveIndex((nextIndex + items.length) % items.length);
  }

  return (
    <section
      className="home-hero"
      style={
        {
          "--hero-accent": heroAccents[movie.id] ?? "var(--primary-bright)",
        } as CSSProperties
      }
    >
      <video
        aria-hidden="true"
        autoPlay
        className="hero-bg-video home-hero-video"
        loop
        muted
        playsInline
        poster={movie.backdropPath}
      >
        {movie.trailerPath ? (
          <source src={movie.trailerPath} type="video/webm" />
        ) : null}
      </video>
      <div className="hero-vignette home-hero-vignette" />
      <div className="home-container home-hero-content">
        <p className="home-hero-kicker">
          {movie.status === "now-showing"
            ? "ĐANG CHIẾU TẠI CINEVERSE"
            : "SẮP CHIẾU TẠI CINEVERSE"}
        </p>
        <h1>{movie.title}</h1>
        <p className="home-hero-tagline">{movie.tagline}</p>
        <div className="home-hero-meta">
          <span>{movie.ratingLabel}</span>
          <span>{movie.durationMinutes} phút</span>
          <span>{movie.formats.join(" · ")}</span>
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
            <Link className="home-primary-button" href={`/movies/${movie.id}`}>
              Khám phá phim
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          )}
          <TrailerDialog movie={movie} triggerClassName="home-ghost-button" />
        </div>
      </div>
      <div className="home-container home-hero-switcher">
        <div className="home-hero-switcher-head">
          <span>Phim nổi bật</span>
          <div className="home-hero-switcher-arrows">
            <Button
              aria-label="Phim trước"
              onClick={() => setActive(activeIndex - 1)}
              size="icon-lg"
              variant="ghost"
            >
              <ArrowLeftIcon />
            </Button>
            <Button
              aria-label="Phim tiếp theo"
              onClick={() => setActive(activeIndex + 1)}
              size="icon-lg"
              variant="ghost"
            >
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
        <div className="home-hero-tabs grid grid-cols-5">
          {items.map((item, index) => (
            <button
              className={index === activeIndex ? "is-active" : undefined}
              key={item.id}
              onClick={() => setActive(index)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

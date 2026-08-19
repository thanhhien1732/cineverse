"use client";

import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRightIcon, XIcon } from "lucide-react";
import type { Movie } from "@/types/domain";

export function TrailerDialog({
  movie,
  triggerClassName,
  onOpenChange,
  showDetailLink = true,
}: {
  readonly movie: Movie;
  readonly triggerClassName?: string;
  readonly onOpenChange?: (open: boolean) => void;
  /** Ẩn khi dialog đã mở sẵn trên chính trang chi tiết của phim. */
  readonly showDetailLink?: boolean;
}) {
  return (
    <Dialog onOpenChange={(open) => onOpenChange?.(open)}>
      <DialogTrigger
        render={<button className={triggerClassName} type="button" />}
      >
        <PlayIcon data-icon="inline-start" />
        Xem trailer
      </DialogTrigger>
      <DialogContent
        aria-label={`Trailer ${movie.title}`}
        className="home-preview-modal sm:max-w-5xl bg-surface p-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Trailer {movie.title}</DialogTitle>
          <DialogDescription>
            Trailer giới thiệu phim {movie.title}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          render={
            <Button
              aria-label="Đóng trailer"
              className="home-preview-close"
              size="icon-lg"
              type="button"
              variant="ghost"
            />
          }
        >
          <XIcon />
        </DialogClose>
        {movie.trailerEmbedCode ? (
          <div
            className="home-preview-video home-preview-embed aspect-video w-full bg-black"
            dangerouslySetInnerHTML={{ __html: movie.trailerEmbedCode }}
          />
        ) : (
          <div className="home-preview-image">
            <PlayIcon className="size-10" />
          </div>
        )}
        <div className="home-preview-copy">
          <p className="eyebrow">Featured preview</p>
          <h3>{movie.title}</h3>
          <p>
            {movie.trailerEmbedCode
              ? "Khám phá video giới thiệu nổi bật của bộ phim."
              : "Khám phá những khung hình nổi bật và thông tin mới nhất của bộ phim."}
          </p>
          {showDetailLink ? (
            <Link className="home-text-link" href={`/movies/${movie.id}`}>
              Mở trang chi tiết
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

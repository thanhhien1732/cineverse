"use client";

import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Movie } from "@/types/domain";

export function TrailerDialog({
  movie,
  triggerClassName,
}: {
  readonly movie: Movie;
  readonly triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className={triggerClassName} size="lg" variant="outline" />
        }
      >
        <PlayIcon data-icon="inline-start" />
        Xem trailer
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-surface p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Trailer {movie.title}</DialogTitle>
          <DialogDescription>
            Trailer giới thiệu phim {movie.title}
          </DialogDescription>
        </DialogHeader>
        {movie.trailerPath ? (
          <video
            controls
            className="aspect-video w-full rounded-xl bg-black"
            poster={movie.backdropPath}
            preload="metadata"
          >
            <source src={movie.trailerPath} type="video/webm" />
          </video>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-surface-raised p-8 text-center">
            <PlayIcon className="size-8 text-primary-bright" />
            <p className="font-semibold">Trailer sẽ được cập nhật sớm.</p>
            <p className="text-sm text-muted-foreground">
              Cineverse đang chuẩn bị bản xem trước cho {movie.title}.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

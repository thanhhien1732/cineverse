import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, Clock3Icon, MapPinIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { TrailerDialog } from "@/components/movies/trailer-dialog";
import { mockCatalogueRepository, mockShowtimeRepository } from "@/services/mock-repositories";

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await mockCatalogueRepository.findMovieById(id);
  if (!movie) notFound();
  const [cinemas, showtimes] = await Promise.all([mockShowtimeRepository.findCinemas(), mockShowtimeRepository.findShowtimesByMovie(movie.id)]);
  return <>
    <section className="relative isolate overflow-hidden border-b border-border"><Image alt="" aria-hidden className="-z-20 object-cover opacity-35" fill priority sizes="100vw" src={movie.backdropPath} /><div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_10%,rgb(5_7_13/82%)_56%,rgb(5_7_13/30%)_100%)]" /><div className="mx-auto grid min-h-[34rem] w-full max-w-[85rem] items-end gap-8 px-page py-section md:grid-cols-[13rem_minmax(0,1fr)] md:items-center"><Image alt={`Poster ${movie.title}`} className="hidden rounded-xl object-cover shadow-cinema md:block" height={320} width={213} src={movie.posterPath} /><div className="flex max-w-2xl flex-col gap-5"><p className="text-xs font-bold tracking-[0.24em] text-primary-bright">{movie.status === "now-showing" ? "NOW SHOWING" : "COMING SOON"}</p><h1 className="text-5xl font-black tracking-[-0.08em] sm:text-7xl">{movie.title}</h1><p className="text-xl text-foreground-muted">{movie.tagline}</p><div className="flex flex-wrap gap-2">{movie.formats.map((format) => <Badge key={format} variant="outline" className="bg-background/60 text-foreground">{format}</Badge>)}</div><div className="flex flex-wrap gap-3"><TrailerDialog movie={movie} /><Link href="/booking/showtimes" className={buttonVariants({ size: "lg" })}>Chọn suất chiếu <ArrowRightIcon data-icon="inline-end" /></Link></div></div></div></section>
    <section className="mx-auto grid w-full max-w-[85rem] gap-12 px-page py-section lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="flex flex-col gap-6"><h2 className="text-3xl font-black tracking-[-0.06em]">Về bộ phim</h2><p className="max-w-3xl text-lg leading-8 text-foreground-muted">{movie.description}</p><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-border bg-surface p-5"><Clock3Icon className="mb-3 size-5 text-primary-bright" /><p className="text-sm text-muted-foreground">Thời lượng</p><p className="font-semibold">{movie.durationMinutes} phút</p></div><div className="rounded-xl border border-border bg-surface p-5"><MapPinIcon className="mb-3 size-5 text-primary-bright" /><p className="text-sm text-muted-foreground">Thể loại</p><p className="font-semibold">{movie.genres.join(" · ")}</p></div></div></div><aside className="rounded-xl border border-border bg-surface p-6"><p className="text-xs font-bold tracking-[0.2em] text-primary-bright">SHOWTIMES</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Suất chiếu sơ bộ</h2>{showtimes.length ? <div className="mt-6 flex flex-col gap-4">{showtimes.map((showtime) => <div key={showtime.id} className="rounded-lg border border-border p-4"><p className="font-semibold">{cinemas.find((cinema) => cinema.id === showtime.cinemaId)?.name}</p><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("vi-VN", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(showtime.startsAt))} · {showtime.format}</p></div>)}<Button>Chọn suất chiếu</Button></div> : <p className="mt-5 text-sm leading-6 text-muted-foreground">Suất chiếu đang được cập nhật. Hãy quay lại sớm để chọn chỗ ngồi.</p>}</aside></section>
  </>;
}

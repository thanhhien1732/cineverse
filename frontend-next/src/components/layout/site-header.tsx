"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SearchIcon, TicketIcon, UserRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteHeader() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/movies?q=${encodeURIComponent(value)}` : "/movies");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 w-full max-w-[85rem] items-center gap-4 px-page py-3">
        <Link className="shrink-0 text-lg font-black tracking-[-0.08em] text-foreground" href="/">
          CINE<span className="text-primary">VERSE</span>
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link className="transition-colors hover:text-foreground" href="/">Trang chủ</Link>
          <Link className="transition-colors hover:text-foreground" href="/movies">Phim</Link>
          <Link className="transition-colors hover:text-foreground" href="/tickets">Vé của tôi</Link>
        </nav>
        <form className="ml-auto hidden max-w-xs flex-1 md:block" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-search">Tìm phim</label>
          <div className="relative">
            <SearchIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Tìm phim" />
          </div>
        </form>
        <Button className="shrink-0" size="sm" variant="outline" aria-label="Xem vé của tôi">
          <TicketIcon data-icon="inline-start" />
          <span className="hidden sm:inline">Vé của tôi</span>
        </Button>
        <Link href="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground"><UserRoundIcon aria-hidden className="size-4" /><span className="sr-only">Tài khoản</span></Link>
      </div>
    </header>
  );
}

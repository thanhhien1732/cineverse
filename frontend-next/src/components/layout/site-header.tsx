"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon, TicketIcon, UserRoundIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBookingStore } from "@/lib/stores/booking.store";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const booking = useBookingStore((state) => state);
  const destination = booking.showtimeId
    ? booking.seatIds.length
      ? "/booking/combos"
      : `/booking/${booking.showtimeId}/seats`
    : booking.tickets.length
      ? "/tickets"
      : "/showtimes";
  const items = [
    ["Trang chủ", "/"],
    ["Phim", "/movies"],
    ["Đang chiếu", "/movies?status=now-showing"],
    ["Sắp chiếu", "/movies?status=coming-soon"],
  ] as const;
  const isHome = pathname === "/";
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  useEffect(() => {
    const syncScrollState = () => setIsScrolled(window.scrollY > 40);

    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });

    return () => window.removeEventListener("scroll", syncScrollState);
  }, []);

  return (
    <header
      className={`site-header z-40${isHome ? " site-header-home fixed inset-x-0 top-0" : " sticky top-0"}${isScrolled ? " is-scrolled" : ""}`}
    >
      <div className="home-container site-header-inner flex items-center gap-4">
        <Link className="shrink-0" href="/" aria-label="CINEVERSE home">
          <Image
            alt="CINEVERSE"
            height={28}
            width={154}
            src="/assets/logo.svg"
            priority
          />
        </Link>
        <nav className="site-desktop-nav hidden items-center lg:flex">
          {items.map(([label, href]) => (
            <Link
              key={href}
              className={
                active(href)
                  ? "font-semibold text-foreground"
                  : "hover:text-foreground"
              }
              href={href}
              aria-current={active(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-header-actions ml-auto hidden lg:flex">
          <Link className="site-account-link" href="/auth">
            <UserRoundIcon aria-hidden="true" className="size-[1.125rem]" />
            <span>Tài khoản</span>
          </Link>
          <Link className="site-ticket-link" href={destination}>
            <TicketIcon aria-hidden="true" className="size-[1.125rem]" />
            <span>{booking.showtimeId ? "Tiếp tục đặt vé" : "Vé của bạn"}</span>
            <b
              className={
                booking.seatIds.length || booking.tickets.length
                  ? "has-items"
                  : undefined
              }
            >
              {booking.seatIds.length || booking.tickets.length}
            </b>
          </Link>
        </div>
        <Link
          className="site-account-link site-account-link-compact lg:hidden"
          href="/auth"
          aria-label="Tài khoản"
        >
          <UserRoundIcon className="size-5" />
        </Link>
        <button
          className="site-nav-toggle lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          type="button"
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      {open ? (
        <div className="site-mobile-panel border-t px-page py-4 lg:hidden">
          <nav className="site-mobile-nav grid gap-3 text-sm">
            {items.map(([label, href]) => (
              <Link key={href} onClick={() => setOpen(false)} href={href}>
                {label}
              </Link>
            ))}
            <Link onClick={() => setOpen(false)} href="/#trailers">
              Trailers & video nổi bật
            </Link>
            <Link onClick={() => setOpen(false)} href="/auth">
              Đăng nhập / Đăng ký
            </Link>
            <Link onClick={() => setOpen(false)} href={destination}>
              Tiếp tục đặt vé
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

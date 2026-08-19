"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon, TicketIcon, UserRoundIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBookingStore } from "@/lib/stores/booking.store";
import { useCurrentProfile, type AuthProfile } from "@/lib/stores/auth.store";
import { getInitials, getLastName } from "@/lib/member";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const booking = useBookingStore((state) => state);
  const profile = useCurrentProfile();
  const isAuthenticated = Boolean(profile);
  const ticketDestination = booking.showtimeId
    ? booking.seatIds.length
      ? "/booking/combos"
      : `/booking/${booking.showtimeId}/seats`
    : booking.tickets.length
      ? "/tickets"
      : "/showtimes";
  const destination = isAuthenticated
    ? ticketDestination
    : `/auth?next=${encodeURIComponent(ticketDestination)}`;
  const items = [
    ["Trang chủ", "/"],
    ["Phim", "/movies"],
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
            height={53}
            width={236}
            src="/assets/logo.svg"
            priority
          />
        </Link>
        <nav className="site-desktop-nav hidden items-center lg:flex">
          {items.map(([label, href]) => (
            <Link
              key={href}
              className={active(href) ? "is-active" : undefined}
              href={href}
              aria-current={active(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-header-actions ml-auto hidden lg:flex">
          <Link
            className={`site-account-link${isAuthenticated ? " is-authenticated" : ""}`}
            href="/auth"
            title={
              profile
                ? `Mở hồ sơ ${profile.fullName}`
                : "Đăng nhập hoặc đăng ký"
            }
          >
            <AccountAvatar profile={profile} />
            <span>{profile ? getLastName(profile.fullName) : "Tài khoản"}</span>
          </Link>
          <Link className="site-ticket-link" href={destination}>
            <TicketIcon aria-hidden="true" className="size-4.5" />
            <span>{booking.showtimeId ? "Đang đặt vé" : "Vé của tôi"}</span>
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
          className={`site-account-link site-account-link-compact lg:hidden${isAuthenticated ? " is-authenticated" : ""}`}
          href="/auth"
          aria-label={profile ? `Tài khoản: ${profile.fullName}` : "Tài khoản"}
        >
          <AccountAvatar profile={profile} />
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
              {profile
                ? `Tài khoản: ${profile.fullName}`
                : "Đăng nhập / Đăng ký"}
            </Link>
            <Link onClick={() => setOpen(false)} href={destination}>
              {booking.showtimeId ? "Tiếp tục đặt vé" : "Vé của tôi"}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function AccountAvatar({
  profile,
}: {
  readonly profile: AuthProfile | null;
}) {
  if (profile?.avatarDataUrl) {
    return (
      <span className="site-account-avatar">
        {/* Ảnh là data URL do người dùng tải lên nên không dùng next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="site-account-avatar-image" src={profile.avatarDataUrl} />
      </span>
    );
  }

  if (profile) {
    return (
      <span className="site-account-avatar site-account-avatar-initials">
        {getInitials(profile.fullName)}
      </span>
    );
  }

  return <UserRoundIcon aria-hidden="true" className="size-4.5" />;
}

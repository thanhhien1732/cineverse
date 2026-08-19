"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBookingStore } from "@/lib/stores/booking.store";
import { useCurrentProfile } from "@/lib/stores/auth.store";
export default function Page() {
  const router = useRouter();
  const tickets = useBookingStore((state) => state.tickets);
  const profile = useCurrentProfile();

  useEffect(() => {
    if (!profile) {
      router.replace("/auth?next=/tickets");
    }
  }, [profile, router]);

  if (!profile) {
    return null;
  }

  return (
    <section className="mx-auto max-w-4xl px-page py-section">
      <h1 className="text-4xl font-black">Vé của tôi</h1>
      {tickets.length ? (
        <div className="mt-8 grid gap-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/ticket/${ticket.id}`}
              className="rounded-xl border border-border bg-surface p-5 hover:border-primary"
            >
              <p className="font-bold">{ticket.movieTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.code} · Ghế {ticket.seatLabels.join(", ")} ·{" "}
                {ticket.status === "valid" ? "Sắp chiếu" : "Đã sử dụng"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">
          Chưa có vé nào. Hãy chọn một bộ phim để bắt đầu.
        </p>
      )}
    </section>
  );
}

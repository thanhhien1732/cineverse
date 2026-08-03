"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TicketCard } from "@/components/booking/booking-flow";
import { useBookingStore } from "@/lib/stores/booking.store";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  const ticket = useBookingStore((state) =>
    state.tickets.find((item) => item.id === id),
  );
  return (
    <section className="mx-auto max-w-3xl px-page py-section">
      <h1 className="text-4xl font-black">Mã vé điện tử</h1>
      <div className="mt-8">
        {ticket ? (
          <TicketCard ticket={ticket} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8">
            <h2 className="font-bold">Chưa có mã vé hợp lệ</h2>
            <p className="mt-2 text-muted-foreground">
              Hãy hoàn thành đặt vé để nhận mã xác nhận CINEVERSE.
            </p>
            <Link
              className="mt-4 inline-block text-primary-bright"
              href="/movies"
            >
              Chọn phim ngay
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

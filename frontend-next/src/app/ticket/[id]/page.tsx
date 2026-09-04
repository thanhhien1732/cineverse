"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TicketIcon } from "lucide-react";
import { BookingSteps } from "@/components/booking/booking-flow";
import { TicketView } from "@/components/booking/ticket-view";
import { useBookingStore } from "@/lib/stores/booking.store";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const ticket = useBookingStore((state) =>
    state.tickets.find((item) => item.id === id),
  );

  return (
    <section className="ticket-section mx-auto max-w-340 px-page py-section">
      <div className="ticket-page-heading">
        <p className="eyebrow">Đặt vé thành công</p>
        <h1 className="mt-3 text-5xl font-black uppercase">
          Vé điện tử đã sẵn sàng
        </h1>
        <p className="mt-4 text-muted-foreground">
          Lưu mã vé hoặc in vé trước khi đến rạp.
        </p>
        <div className="mt-10">
          <BookingSteps active={5} />
        </div>
      </div>
      {ticket ? (
        <TicketView ticket={ticket} />
      ) : (
        <section className="checkout-empty-state">
          <TicketIcon aria-hidden="true" className="size-8 text-destructive" />
          <h2>Chưa có mã vé hợp lệ</h2>
          <p>Hãy hoàn thành một lượt đặt vé để nhận mã xác nhận CINEVERSE.</p>
          <Link href="/movies">Chọn phim ngay</Link>
        </section>
      )}
    </section>
  );
}

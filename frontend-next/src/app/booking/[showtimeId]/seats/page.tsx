import { SeatPicker } from "@/components/booking/seat-picker";

export default async function Page({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  await params;
  return (
    <section className="mx-auto max-w-340 px-page py-section">
      <p className="text-xs font-bold tracking-[.2em] text-cv-primary-bright uppercase">
        Đặt vé
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase">Chọn ghế</h1>
      <p className="mt-4 text-muted-foreground">
        Chọn vị trí ngồi phù hợp cho suất chiếu bạn vừa chọn.
      </p>
      <div className="mt-10">
        <SeatPicker />
      </div>
    </section>
  );
}

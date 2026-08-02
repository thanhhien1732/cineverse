import { SeatPicker } from "@/components/booking/booking-flow";
export default async function Page({params}:{params:Promise<{showtimeId:string}>}){await params;return <section className="mx-auto max-w-5xl px-page py-section"><h1 className="text-4xl font-black">Chọn ghế</h1><SeatPicker /></section>}

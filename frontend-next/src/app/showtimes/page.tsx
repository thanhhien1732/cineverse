import { ShowtimePicker } from "@/components/booking/booking-flow";
import { mockShowtimeRepository } from "@/services/mock-repositories";
export default async function Page(){return <section className="mx-auto max-w-5xl px-page py-section"><h1 className="text-4xl font-black">Chọn suất chiếu</h1><ShowtimePicker showtimes={await mockShowtimeRepository.findShowtimesByMovie("minions-monsters")} /></section>}

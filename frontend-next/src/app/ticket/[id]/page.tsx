"use client";
import { useBookingStore } from "@/lib/stores/booking.store";
export default function Page(){const ticket=useBookingStore((s)=>s.ticket);return <section className="mx-auto max-w-3xl px-page py-section"><h1 className="text-4xl font-black">Mã vé</h1>{ticket?<div className="mt-6 rounded-xl border border-border p-6"><p>{ticket.movieTitle}</p><strong>{ticket.code}</strong><p>Ghế: {ticket.seatLabels.join(", ")}</p><div className="mt-4 grid size-32 grid-cols-6 gap-1">{Array.from({length:36},(_,i)=><i key={i} className="bg-primary"/>)}</div></div>:<p>Chưa có vé.</p>}</section>}

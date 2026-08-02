"use client";
import Link from "next/link";import { useBookingStore } from "@/lib/stores/booking.store";
export default function Page(){const ticket=useBookingStore((s)=>s.ticket);return <section className="mx-auto max-w-3xl px-page py-section"><h1 className="text-4xl font-black">Vé của tôi</h1>{ticket?<Link href={`/ticket/${ticket.id}`} className="mt-6 block rounded-xl border border-border p-6">{ticket.movieTitle} · {ticket.code}</Link>:<p>Chưa có vé nào.</p>}</section>}

"use client";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default function Page(){const [result,setResult]=useState<string | null>(null);function verify(e:FormEvent){e.preventDefault();setResult('Vé hợp lệ · Minions & Monsters · Ghế A1');}return <section className="mx-auto max-w-xl px-page py-section"><p className="text-xs font-bold tracking-[.2em] text-primary-bright">GATE CONTROL</p><h1 className="mt-2 text-4xl font-black">Xác thực vé</h1><p className="mt-3 text-muted-foreground">Nhập mã vé hoặc dùng camera ở bản tích hợp production.</p><form className="mt-6 flex gap-3" onSubmit={verify}><Input placeholder="Ví dụ: CV-123456" required/><Button type="submit">Kiểm tra vé</Button></form>{result&&<div className="mt-6 rounded-xl border border-cv-success bg-surface p-5 text-cv-success">{result}</div>}</section>}

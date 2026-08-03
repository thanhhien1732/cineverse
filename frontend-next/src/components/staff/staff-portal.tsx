"use client";
import jsQR from "jsqr";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CameraIcon, LogOutIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBookingStore } from "@/lib/stores/booking.store";
import { useStaffStore } from "@/lib/stores/staff.store";
import type { Ticket } from "@/types/domain";

function GateShell({ children }: { children: React.ReactNode }) {
  const profile = useStaffStore((state) => state.profile);
  const signOut = useStaffStore((state) => state.signOut);
  return (
    <main className="min-h-screen bg-background px-page py-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border pb-5">
        <Link href="/" className="font-black tracking-[-.08em]">
          CINE<span className="text-primary">VERSE</span>{" "}
          <span className="ml-2 text-xs tracking-[.16em] text-muted-foreground">
            GATE CONTROL
          </span>
        </Link>
        {profile && (
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOutIcon data-icon="inline-start" />
            Đăng xuất
          </Button>
        )}
      </header>
      {children}
    </main>
  );
}
export function StaffAuthPortal() {
  const profile = useStaffStore((state) => state.profile);
  const signIn = useStaffStore((state) => state.signIn);
  if (profile)
    return (
      <GateShell>
        <section className="mx-auto mt-20 max-w-xl rounded-xl border border-border bg-surface p-8">
          <h1 className="text-3xl font-black">Cổng kiểm soát vé sẵn sàng</h1>
          <Link
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            href="/verify"
          >
            Mở màn hình kiểm soát vé
          </Link>
        </section>
      </GateShell>
    );
  return (
    <GateShell>
      <form
        className="mx-auto mt-16 grid max-w-md gap-3 rounded-xl border border-border bg-surface p-7"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          signIn({
            fullName: String(data.get("fullName") || "Nhân viên Cineverse"),
            email: String(data.get("email")),
            role: "gate-control-admin",
          });
        }}
      >
        <h1 className="text-3xl font-black">Đăng nhập nhân viên</h1>
        <Input name="fullName" placeholder="Họ tên nhân viên" />
        <Input
          name="email"
          type="email"
          required
          placeholder="Email nhân viên"
        />
        <Input
          name="password"
          type="password"
          required
          minLength={4}
          placeholder="Mật khẩu"
        />
        <Button type="submit">Đăng nhập</Button>
      </form>
    </GateShell>
  );
}
function findTicket(tickets: readonly Ticket[], code: string) {
  return tickets.find(
    (ticket) => ticket.code.toLowerCase() === code.trim().toLowerCase(),
  );
}
export function TicketVerifier() {
  const profile = useStaffStore((state) => state.profile);
  const tickets = useBookingStore((state) => state.tickets);
  const markTicket = useBookingStore((state) => state.markTicket);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Camera chưa bật.");
  const [result, setResult] = useState<"valid" | "used" | "invalid" | null>(
    null,
  );
  const verify = (value: string) => {
    setCode(value);
    const ticket = findTicket(tickets, value);
    if (!ticket) {
      setResult("invalid");
      return;
    }
    if (ticket.status === "used") {
      setResult("used");
      return;
    }
    markTicket(ticket.id, "used");
    setResult("valid");
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setStatus("Camera đã dừng.");
  };
  useEffect(() => () => stopCamera(), []);
  const scanFrame = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(video, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height);
    if (decoded?.data) {
      stopCamera();
      verify(decoded.data);
      return;
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  };
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("Camera đang hoạt động. Căn mã QR vào giữa khung hình.");
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setStatus("Không thể truy cập camera. Kiểm tra quyền camera.");
    }
  };
  const upload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0);
        const data = context.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(data.data, data.width, data.height);
        if (decoded?.data) verify(decoded.data);
        else setStatus("Không tìm thấy QR trong ảnh đã chọn.");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  if (!profile)
    return (
      <GateShell>
        <section className="mx-auto mt-16 max-w-xl rounded-xl border border-destructive bg-surface p-7">
          <h1 className="text-2xl font-bold">Yêu cầu phiên nhân viên</h1>
          <Link href="/admin" className="mt-4 inline-block text-primary-bright">
            Đi tới đăng nhập
          </Link>
        </section>
      </GateShell>
    );
  return (
    <GateShell>
      <section className="mx-auto mt-10 max-w-6xl">
        <h1 className="text-4xl font-black">Kiểm soát vé</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-bold">Quét mã QR</h2>
            <video
              ref={videoRef}
              className="mt-4 aspect-video w-full rounded-lg bg-black"
              autoPlay
              muted
              playsInline
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={startCamera}>
                <CameraIcon data-icon="inline-start" />
                Bắt đầu quét
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Dừng camera
              </Button>
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm">
                <UploadIcon className="mr-2 inline size-4" />
                Tải ảnh QR
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={(event) => upload(event.currentTarget.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{status}</p>
            <form
              className="mt-6 flex gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                verify(code);
              }}
            >
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                placeholder="CV-XXXXXXXX"
              />
              <Button type="submit">Kiểm tra vé</Button>
            </form>
          </section>
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-2xl font-black">
              {result === "valid"
                ? "Vé hợp lệ"
                : result === "used"
                  ? "Vé đã được sử dụng"
                  : result === "invalid"
                    ? "Không tìm thấy vé"
                    : "Sẵn sàng kiểm soát vé"}
            </h2>
            {result && (
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setCode("");
                }}
              >
                Quét vé tiếp theo
              </Button>
            )}
          </section>
        </div>
      </section>
    </GateShell>
  );
}

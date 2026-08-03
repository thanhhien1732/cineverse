"use client";

import jsQR from "jsqr";
import Link from "next/link";
import {
  CameraIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  FileImageIcon,
  LogOutIcon,
  QrCodeIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  TicketIcon,
  UploadIcon,
  XCircleIcon,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBookingStore } from "@/lib/stores/booking.store";
import { useStaffStore } from "@/lib/stores/staff.store";
import type { Ticket, TicketStatus } from "@/types/domain";

type ScannerState = "idle" | "loading" | "valid" | "used" | "invalid";

interface VerificationResult {
  readonly state: Exclude<ScannerState, "idle" | "loading">;
  readonly ticket: Ticket | null;
  readonly query: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatIssuedAt(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function findTicket(tickets: readonly Ticket[], code: string) {
  return tickets.find(
    (ticket) => ticket.code.toLowerCase() === code.trim().toLowerCase(),
  );
}

function GateShell({ children }: { readonly children: ReactNode }) {
  const profile = useStaffStore((state) => state.profile);
  const signOut = useStaffStore((state) => state.signOut);

  return (
    <main className="staff-body min-h-screen">
      <header className="gate-header">
        <div className="gate-header-inner mx-auto w-full max-w-340 px-page">
          <Link aria-label="Cineverse" className="gate-brand" href="/">
            <span className="font-black tracking-[-0.08em]">
              CINE<span className="text-primary">VERSE</span>
            </span>
            <span className="ml-3 text-[0.625rem] font-black tracking-[0.16em] text-muted-foreground">
              GATE CONTROL
            </span>
          </Link>
          {profile ? (
            <div className="gate-header-tools">
              <div className="gate-operator">
                <span className="gate-operator-avatar" aria-hidden="true">
                  {initials(profile.fullName) || "CV"}
                </span>
                <span className="gate-operator-copy">
                  <strong>{profile.fullName}</strong>
                  <small>Nhân viên kiểm soát</small>
                </span>
              </div>
              <Button
                className="gate-logout"
                onClick={signOut}
                size="sm"
                variant="outline"
              >
                <LogOutIcon data-icon="inline-start" />
                Đăng xuất
              </Button>
            </div>
          ) : null}
        </div>
      </header>
      {children}
    </main>
  );
}

function StaffLoginForm() {
  const signIn = useStaffStore((state) => state.signIn);
  const { notify } = useFeedback();
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (fullName.length < 2 || !email || password.length < 4) {
      const nextMessage =
        "Vui lòng nhập đủ họ tên, email và mật khẩu nhân viên.";
      setMessage(nextMessage);
      notify(nextMessage, "error");
      return;
    }

    signIn({ fullName, email, role: "gate-control-admin" });
    notify("Đã mở phiên kiểm soát vé cho nhân viên.");
  }

  return (
    <main className="staff-login-page">
      <section className="staff-login-shell">
        <Link aria-label="Cineverse" className="staff-brand" href="/">
          <span className="text-3xl font-black tracking-[-0.08em]">
            CINE<span className="text-primary">VERSE</span>
          </span>
        </Link>
        <form className="staff-login-card" onSubmit={handleSubmit}>
          <header className="staff-card-heading">
            <p className="eyebrow">STAFF ACCESS</p>
            <h1>Đăng nhập nhân viên</h1>
            <p>
              Phiên làm việc chỉ được lưu trong trình duyệt hiện tại để bảo vệ
              màn hình kiểm soát vé.
            </p>
          </header>
          <div className="staff-form">
            <Input name="fullName" placeholder="Họ tên nhân viên" required />
            <Input
              name="email"
              placeholder="Email nhân viên"
              required
              type="email"
            />
            <Input
              minLength={4}
              name="password"
              placeholder="Mật khẩu"
              required
              type="password"
            />
          </div>
          <p
            aria-live="polite"
            className={`staff-form-message${message ? " is-error" : ""}`}
          >
            {message}
          </p>
          <div className="staff-form-actions">
            <Button type="submit">Mở cổng kiểm soát</Button>
          </div>
        </form>
        <p className="staff-login-footer">CINEVERSE · GATE CONTROL SYSTEM</p>
      </section>
    </main>
  );
}

export function StaffAuthPortal() {
  const profile = useStaffStore((state) => state.profile);
  const hasHydrated = useStaffStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <main className="staff-body min-h-screen" />;
  }

  if (!profile) {
    return <StaffLoginForm />;
  }

  return (
    <GateShell>
      <section className="mx-auto w-full max-w-340 px-page py-16">
        <div className="staff-login-card mx-auto max-w-2xl">
          <p className="eyebrow">GATE CONTROL READY</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.055em]">
            Cổng kiểm soát vé sẵn sàng
          </h1>
          <div className="staff-admin-profile">
            <span aria-hidden="true">{initials(profile.fullName) || "CV"}</span>
            <div>
              <strong>{profile.fullName}</strong>
              <small>{profile.email}</small>
            </div>
          </div>
          <Link className="mt-6 inline-flex" href="/verify">
            <Button>
              <ScanLineIcon data-icon="inline-start" />
              Mở màn hình kiểm soát vé
            </Button>
          </Link>
        </div>
      </section>
    </GateShell>
  );
}

function ResultIcon({ status }: { readonly status: TicketStatus | "invalid" }) {
  if (status === "valid") {
    return <CheckCircle2Icon aria-hidden="true" />;
  }

  return status === "used" ? (
    <CircleAlertIcon aria-hidden="true" />
  ) : (
    <XCircleIcon aria-hidden="true" />
  );
}

function TicketValidationResult({
  result,
  onAccept,
  onNext,
}: {
  readonly result: VerificationResult;
  readonly onAccept: () => void;
  readonly onNext: () => void;
}) {
  const isValid = result.state === "valid";
  const isUsed = result.state === "used";
  const ticket = result.ticket;
  const statusLabel = isValid
    ? "VÉ HỢP LỆ"
    : isUsed
      ? "VÉ ĐÃ SỬ DỤNG"
      : "KHÔNG TÌM THẤY VÉ";
  const title = isValid
    ? "Cho phép vào rạp"
    : isUsed
      ? "Từ chối vào rạp"
      : "Mã vé không hợp lệ";

  return (
    <article
      className={`verify-result-card is-${isValid ? "valid" : "invalid"}`}
    >
      <header className="verify-result-head">
        <span>
          <ResultIcon status={ticket?.status ?? "invalid"} />
        </span>
        <div>
          <p className="eyebrow">{statusLabel}</p>
          <h2>{title}</h2>
        </div>
        <b
          className={`verification-status-badge${isValid ? "" : " is-rejected"
            }`}
        >
          {isValid ? "CHỜ XÁC NHẬN" : "TỪ CHỐI"}
        </b>
      </header>

      {ticket ? (
        <>
          <div className="verified-ticket-code">
            <small>MÃ VÉ</small>
            <strong>{ticket.code}</strong>
          </div>
          <dl className="verify-ticket-grid">
            <div>
              <dt>Phim</dt>
              <dd>{ticket.movieTitle}</dd>
            </div>
            <div>
              <dt>Suất chiếu</dt>
              <dd>{ticket.showtimeId}</dd>
            </div>
            <div>
              <dt>Ghế</dt>
              <dd>{ticket.seatLabels.join(", ")}</dd>
            </div>
            <div>
              <dt>Loại vé</dt>
              <dd>{ticket.seatLabels.length} vé điện tử</dd>
            </div>
            <div>
              <dt>Khách hàng</dt>
              <dd>{ticket.customerName}</dd>
            </div>
            <div>
              <dt>Thanh toán</dt>
              <dd>{formatCurrency(ticket.total)}</dd>
            </div>
          </dl>
          <footer>
            <span>
              <TicketIcon aria-hidden="true" className="mr-2 inline size-4" />
              Phát hành: {formatIssuedAt(ticket.createdAt)}
            </span>
            <small>
              {isUsed ? "Vé đã được kiểm soát trước đó." : "Chưa vào rạp."}
            </small>
          </footer>
        </>
      ) : (
        <p>
          Không tìm thấy vé tương ứng với mã <strong>{result.query}</strong>.
          Vui lòng kiểm tra lại mã hoặc thử quét lại QR.
        </p>
      )}

      <div className="verify-result-actions">
        {isValid ? (
          <Button onClick={onAccept}>
            <ShieldCheckIcon data-icon="inline-start" />
            Xác nhận cho vào rạp
          </Button>
        ) : null}
        <Button onClick={onNext} variant={isValid ? "outline" : "default"}>
          <ScanLineIcon data-icon="inline-start" />
          Kiểm soát vé tiếp theo
        </Button>
      </div>
    </article>
  );
}

export function TicketVerifier() {
  const profile = useStaffStore((state) => state.profile);
  const hasHydrated = useStaffStore((state) => state.hasHydrated);
  const tickets = useBookingStore((state) => state.tickets);
  const markTicket = useBookingStore((state) => state.markTicket);
  const { notify } = useFeedback();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanLoopRef = useRef<() => void>(() => undefined);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Sẵn sàng kiểm tra mã vé.");
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraLive(false);
  }, []);

  const verify = useCallback(
    (value: string) => {
      const query = value.trim();

      if (!query) {
        setStatus("Vui lòng nhập hoặc quét mã vé.");
        notify("Vui lòng nhập hoặc quét mã vé.", "warning");
        return;
      }

      setCode(query);
      setScannerState("loading");
      setStatus("Đang đối chiếu thông tin vé...");

      window.setTimeout(() => {
        const ticket = findTicket(tickets, query);
        const nextState: VerificationResult["state"] = !ticket
          ? "invalid"
          : ticket.status === "valid"
            ? "valid"
            : "used";

        setResult({ state: nextState, ticket: ticket ?? null, query });
        setScannerState(nextState);
        setStatus(
          nextState === "valid"
            ? "Đã tìm thấy vé. Chờ nhân viên xác nhận vào rạp."
            : nextState === "used"
              ? "Vé này đã được sử dụng."
              : "Không tìm thấy vé tương ứng.",
        );
        notify(
          nextState === "valid"
            ? "Vé hợp lệ. Hãy xác nhận trước khi cho khách vào rạp."
            : nextState === "used"
              ? "Vé đã được sử dụng trước đó."
              : "Mã vé không hợp lệ.",
          nextState === "valid" ? "success" : "error",
        );
      }, 260);
    },
    [notify, tickets],
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current || !video.videoWidth) {
      if (streamRef.current) {
        frameRef.current = window.requestAnimationFrame(() => {
          scanLoopRef.current();
        });
      }
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height);

    if (decoded?.data) {
      stopCamera();
      verify(decoded.data);
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      scanLoopRef.current();
    });
  }, [stopCamera, verify]);

  useEffect(() => {
    scanLoopRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Thiết bị này không hỗ trợ camera. Hãy nhập mã vé thủ công.");
      notify("Thiết bị này không hỗ trợ camera.", "error");
      return;
    }

    stopCamera();
    setScannerState("loading");
    setStatus("Đang khởi tạo camera...");

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

      setIsCameraLive(true);
      setScannerState("idle");
      setStatus("Camera đang hoạt động. Căn mã QR vào giữa khung hình.");
      frameRef.current = window.requestAnimationFrame(scanFrame);
    } catch {
      setScannerState("idle");
      setStatus("Không thể mở camera. Kiểm tra quyền camera và thử lại.");
      notify("Không thể truy cập camera.", "error");
    }
  }, [notify, scanFrame, stopCamera]);

  function upload(file: File | undefined) {
    if (!file) {
      return;
    }

    setScannerState("loading");
    setStatus("Đang đọc ảnh QR đã tải lên...");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { willReadFrequently: true });

        if (!canvas || !context) {
          return;
        }

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);

        if (decoded?.data) {
          verify(decoded.data);
          return;
        }

        setScannerState("idle");
        setStatus("Không tìm thấy QR trong ảnh đã chọn.");
        notify("Không tìm thấy QR trong ảnh đã chọn.", "error");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function resetVerification() {
    stopCamera();
    setCode("");
    setResult(null);
    setScannerState("idle");
    setStatus("Sẵn sàng kiểm tra mã vé tiếp theo.");
  }

  function acceptTicket() {
    if (!result?.ticket) {
      return;
    }

    markTicket(result.ticket.id, "used");
    setResult({
      ...result,
      state: "used",
      ticket: { ...result.ticket, status: "used" },
    });
    setScannerState("used");
    setStatus("Đã xác nhận vé và ghi nhận khách vào rạp.");
    notify("Đã xác nhận cho khách vào rạp.");
  }

  useEffect(() => () => stopCamera(), [stopCamera]);

  if (!hasHydrated) {
    return <main className="staff-body min-h-screen" />;
  }

  if (!profile) {
    return <StaffLoginForm />;
  }

  return (
    <GateShell>
      <section className="verify-page">
        <header className="verify-hero">
          <div className="mx-auto w-full max-w-[85rem] px-page">
            <p className="eyebrow">GATE CONTROL</p>
            <h1>Kiểm soát vé</h1>
            <p>
              Quét QR hoặc nhập mã vé để xác thực nhanh thông tin khách trước
              khi vào rạp.
            </p>
          </div>
        </header>
        <section className="verify-section mx-auto w-full max-w-[85rem] px-page py-7">
          <div className="verify-layout">
            <article className="verify-scanner-card">
              <header className="verify-card-heading">
                <span>
                  <QrCodeIcon aria-hidden="true" />
                </span>
                <div>
                  <h2>Quét mã QR</h2>
                  <p>Đặt mã QR vào giữa vùng quét để kiểm tra tự động.</p>
                </div>
              </header>
              <div
                className={`scanner-viewport${isCameraLive ? " is-live" : ""}`}
              >
                <video autoPlay muted playsInline ref={videoRef} />
                <canvas className="hidden" ref={canvasRef} />
                <div className="scanner-placeholder">
                  <span aria-hidden="true" />
                  <strong>
                    {scannerState === "loading"
                      ? "Đang đối chiếu..."
                      : "Sẵn sàng quét QR"}
                  </strong>
                  <small>Cấp quyền camera để bắt đầu quét tự động.</small>
                </div>
                {isCameraLive || scannerState === "loading" ? (
                  <span aria-hidden="true" className="scanner-line" />
                ) : null}
              </div>
              <div className="scanner-actions">
                <Button
                  className="scanner-primary-action"
                  onClick={startCamera}
                >
                  <CameraIcon data-icon="inline-start" />
                  Bắt đầu quét camera
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Dừng camera
                </Button>
                <label
                  className="scanner-upload-action cursor-pointer"
                  htmlFor="qr-image-upload"
                >
                  <UploadIcon data-icon="inline-start" />
                  Tải ảnh QR
                  <input
                    accept="image/*"
                    className="sr-only"
                    id="qr-image-upload"
                    onChange={(event) => upload(event.currentTarget.files?.[0])}
                    type="file"
                  />
                </label>
              </div>
              <p
                aria-live="polite"
                className={`scanner-status${scannerState === "valid"
                    ? " is-success"
                    : scannerState === "used" || scannerState === "invalid"
                      ? " is-error"
                      : ""
                  }`}
              >
                {status}
              </p>
              <details className="verify-manual-disclosure" open>
                <summary>Nhập mã vé thủ công</summary>
                <form
                  className="verify-manual-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    stopCamera();
                    verify(code);
                  }}
                >
                  <Input
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="CV-XXXXXXXX"
                    value={code}
                  />
                  <Button type="submit">Kiểm tra vé</Button>
                </form>
              </details>
            </article>
            <section className="verify-result" aria-live="polite">
              {result ? (
                <TicketValidationResult
                  onAccept={acceptTicket}
                  onNext={resetVerification}
                  result={result}
                />
              ) : (
                <div className="verify-empty">
                  <span>
                    <FileImageIcon aria-hidden="true" />
                  </span>
                  <h2>Sẵn sàng kiểm soát vé</h2>
                  <p>Thông tin vé sẽ hiển thị sau khi xác minh.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </section>
    </GateShell>
  );
}

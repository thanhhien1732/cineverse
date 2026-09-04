import { NextResponse } from "next/server";
import {
  readSeatLocks,
  releaseSeatLocks,
  SEAT_HOLD_SECONDS,
  syncSeatLocks,
} from "@/server/seat-lock-store";

/** Khoá ghế nằm trong RAM nên tuyệt đối không được cache lại response. */
export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ showtimeId: string }>;
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

/** Ghế người khác đang giữ — client dùng để khoá sơ đồ ghế theo thời gian thực. */
export async function GET(request: Request, context: RouteContext) {
  const { showtimeId } = await context.params;
  const clientId = new URL(request.url).searchParams.get("clientId");

  if (!clientId) {
    return badRequest("Thiếu clientId.");
  }

  return NextResponse.json({
    showtimeId,
    holdSeconds: SEAT_HOLD_SECONDS,
    locks: readSeatLocks(showtimeId, clientId),
  });
}

/** Đồng bộ tập ghế phiên này đang chọn; trả về ghế giữ được và ghế bị mất. */
export async function POST(request: Request, context: RouteContext) {
  const { showtimeId } = await context.params;
  const payload: unknown = await request.json().catch(() => null);

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { clientId?: unknown }).clientId !== "string" ||
    !Array.isArray((payload as { seatIds?: unknown }).seatIds)
  ) {
    return badRequest("Payload phải gồm clientId và seatIds.");
  }

  const { clientId, seatIds } = payload as {
    clientId: string;
    seatIds: unknown[];
  };
  const normalizedSeatIds = seatIds.filter(
    (seatId): seatId is string => typeof seatId === "string",
  );

  return NextResponse.json({
    showtimeId,
    holdSeconds: SEAT_HOLD_SECONDS,
    ...syncSeatLocks(showtimeId, clientId, normalizedSeatIds),
  });
}

/** Nhả hết ghế của phiên, dùng khi quay lại bước trước hoặc hết giờ giữ ghế. */
export async function DELETE(request: Request, context: RouteContext) {
  const { showtimeId } = await context.params;
  const clientId = new URL(request.url).searchParams.get("clientId");

  if (!clientId) {
    return badRequest("Thiếu clientId.");
  }

  releaseSeatLocks(showtimeId, clientId);

  return NextResponse.json({ showtimeId, locks: [] });
}

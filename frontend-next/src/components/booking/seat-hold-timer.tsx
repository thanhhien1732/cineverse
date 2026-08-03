"use client";

import { useEffect, useRef, useState } from "react";

interface SeatHoldTimerProps {
  readonly onExpire: () => void;
  readonly durationSeconds?: number;
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function SeatHoldTimer({
  onExpire,
  durationSeconds = 600,
}: SeatHoldTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const hasExpired = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((currentRemaining) => Math.max(0, currentRemaining - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !hasExpired.current) {
      hasExpired.current = true;
      onExpire();
    }
  }, [onExpire, remaining]);

  const isUrgent = remaining > 0 && remaining <= 60;

  return (
    <div
      aria-live="polite"
      className={`seat-hold-timer ${isUrgent || remaining === 0 ? "is-urgent" : ""}`}
    >
      <span>Thời gian giữ ghế</span>
      <strong>{formatRemainingTime(remaining)}</strong>
    </div>
  );
}

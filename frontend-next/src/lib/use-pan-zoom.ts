"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Point {
  readonly x: number;
  readonly y: number;
}

interface PanZoomOptions {
  readonly minZoom?: number;
  readonly maxZoom?: number;
  /** Ngưỡng px để phân biệt kéo di chuyển với một cú click chọn ghế. */
  readonly dragThreshold?: number;
}

/**
 * Phóng to / kéo di chuyển một vùng nội dung bằng transform thay vì thanh cuộn:
 * lăn chuột để zoom quanh con trỏ, giữ chuột để kéo, chụm hai ngón trên cảm ứng.
 */
export function usePanZoom({
  minZoom = 1,
  maxZoom = 2,
  dragThreshold = 4,
}: PanZoomOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(minZoom);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>();

  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const pointersRef = useRef(new Map<number, Point>());
  const panStartRef = useRef<{ pointer: Point; offset: Point } | null>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  /** Bật khi con trỏ đã đi đủ xa, dùng để nuốt cú click ngay sau khi kéo. */
  const didPanRef = useRef(false);

  /** Giữ nội dung luôn nằm trong khung: canh giữa khi nhỏ, chặn mép khi lớn. */
  const clampOffset = useCallback((next: Point, nextZoom: number): Point => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) {
      return next;
    }

    const viewWidth = container.clientWidth;
    const viewHeight = container.clientHeight;
    const contentWidth = content.offsetWidth * nextZoom;
    const contentHeight = content.offsetHeight * nextZoom;

    return {
      x:
        contentWidth <= viewWidth
          ? (viewWidth - contentWidth) / 2
          : Math.min(0, Math.max(viewWidth - contentWidth, next.x)),
      y:
        contentHeight <= viewHeight
          ? (viewHeight - contentHeight) / 2
          : Math.min(0, Math.max(viewHeight - contentHeight, next.y)),
    };
  }, []);

  const apply = useCallback(
    (nextZoom: number, nextOffset: Point) => {
      const clamped = clampOffset(nextOffset, nextZoom);
      zoomRef.current = nextZoom;
      offsetRef.current = clamped;
      setZoom(nextZoom);
      setOffset(clamped);
    },
    [clampOffset],
  );

  /** Zoom sao cho điểm đang nằm dưới con trỏ (hoặc giữa hai ngón) đứng yên. */
  const zoomAt = useCallback(
    (nextZoom: number, focal: Point) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const viewX = focal.x - rect.left;
      const viewY = focal.y - rect.top;
      const currentZoom = zoomRef.current;
      const currentOffset = offsetRef.current;
      const contentX = (viewX - currentOffset.x) / currentZoom;
      const contentY = (viewY - currentOffset.y) / currentZoom;

      apply(nextZoom, {
        x: viewX - contentX * nextZoom,
        y: viewY - contentY * nextZoom,
      });
    },
    [apply],
  );

  const clampZoom = useCallback(
    (value: number) => Math.min(maxZoom, Math.max(minZoom, value)),
    [maxZoom, minZoom],
  );

  const reset = useCallback(() => {
    apply(minZoom, { x: 0, y: 0 });
  }, [apply, minZoom]);

  /** Khung bao luôn cao bằng nội dung ở mức 100% để không phải kéo dọc vô ích. */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setContentHeight(content.offsetHeight);
      apply(zoomRef.current, offsetRef.current);
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [apply]);

  /** Wheel phải là listener gốc non-passive mới chặn được cuộn trang. */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(clampZoom(zoomRef.current - event.deltaY * 0.0015), {
        x: event.clientX,
        y: event.clientY,
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [clampZoom, zoomAt]);

  const pointerDistance = () => {
    const [first, second] = [...pointersRef.current.values()];
    return Math.hypot(second.x - first.x, second.y - first.y);
  };

  const pointerMidpoint = (): Point => {
    const [first, second] = [...pointersRef.current.values()];
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    didPanRef.current = false;

    if (pointersRef.current.size === 2) {
      panStartRef.current = null;
      pinchStartRef.current = {
        distance: pointerDistance(),
        zoom: zoomRef.current,
      };
      return;
    }

    if (pointersRef.current.size === 1) {
      panStartRef.current = {
        pointer: { x: event.clientX, y: event.clientY },
        offset: offsetRef.current,
      };
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) {
      return;
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const pinchStart = pinchStartRef.current;
    if (pointersRef.current.size === 2 && pinchStart) {
      didPanRef.current = true;
      const ratio = pointerDistance() / pinchStart.distance;
      zoomAt(clampZoom(pinchStart.zoom * ratio), pointerMidpoint());
      return;
    }

    const panStart = panStartRef.current;
    if (!panStart) {
      return;
    }

    const deltaX = event.clientX - panStart.pointer.x;
    const deltaY = event.clientY - panStart.pointer.y;

    if (
      !didPanRef.current &&
      Math.hypot(deltaX, deltaY) < dragThreshold
    ) {
      return;
    }

    didPanRef.current = true;
    setIsPanning(true);
    apply(zoomRef.current, {
      x: panStart.offset.x + deltaX,
      y: panStart.offset.y + deltaY,
    });
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (pointersRef.current.size === 0) {
      panStartRef.current = null;
      setIsPanning(false);
    }
  };

  /** Sau khi kéo, chặn cú click lọt xuống ghế bên dưới. */
  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (didPanRef.current) {
      event.preventDefault();
      event.stopPropagation();
      didPanRef.current = false;
    }
  };

  return {
    containerRef,
    contentRef,
    contentHeight,
    zoom,
    offset,
    isPanning,
    reset,
    containerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
      onClickCapture,
    },
  };
}

"use client";

import { useEffect, useState } from "react";

import { defaultCoordinates, type Coordinates } from "@/lib/geo";

export type ViewerLocationStatus = "default" | "located";

/**
 * Xin quyền định vị của khách để xếp rạp gần nhất lên đầu. Trước khi khách
 * đồng ý (hoặc khi bị từ chối) thì dùng toạ độ trung tâm TP.HCM.
 */
export function useViewerLocation(): {
  coordinates: Coordinates;
  status: ViewerLocationStatus;
} {
  const [coordinates, setCoordinates] = useState<Coordinates>(
    defaultCoordinates,
  );
  const [status, setStatus] = useState<ViewerLocationStatus>("default");

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    let active = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active) {
          return;
        }

        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("located");
      },
      () => {
        if (active) {
          setStatus("default");
        }
      },
      { maximumAge: 5 * 60 * 1000, timeout: 8000 },
    );

    return () => {
      active = false;
    };
  }, []);

  return { coordinates, status };
}

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/** Vị trí mặc định khi khách chưa cho phép định vị: trung tâm TP.HCM. */
export const defaultCoordinates: Coordinates = {
  latitude: 10.7769,
  longitude: 106.7009,
};

const earthRadiusKm = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Khoảng cách đường chim bay giữa hai toạ độ, theo km (công thức Haversine). */
export function distanceInKm(from: Coordinates, to: Coordinates): number {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

import { findAreaByQuery } from "./gymSearch";

/**
 * 라이벌은 주소·체육관 좌표 대신 공개한 활동 지역의 중심만 지도에 올린다.
 * 같은 지역은 하나의 권역 배지로 묶어 개인을 지도에서 식별할 수 없게 한다.
 */
export function groupRivalsByArea(partners = []) {
  const groups = new Map();

  partners.forEach((partner) => {
    const area = String(partner?.area || "").trim();
    const resolved = area ? findAreaByQuery(area) : null;
    if (!resolved) return;

    const current = groups.get(resolved.id) || {
      id: resolved.id,
      label: resolved.label,
      lat: resolved.lat,
      lon: resolved.lon,
      count: 0,
    };
    current.count += 1;
    groups.set(resolved.id, current);
  });

  return [...groups.values()];
}

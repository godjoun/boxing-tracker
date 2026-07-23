import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeOsmGym } from "../api/osmGymApi";
import {
  getFavoriteGyms,
  toggleFavoriteGym,
} from "./gymFavorites";
import {
  mergeGymSearchResults,
  validateGymListingForm,
} from "./gymListing";
import { getDistanceKm, hasMapCoordinates, isNearbyMapGym } from "./gymSearch";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("지도형 체육관 검색", () => {
  it("OSM way 중심 좌표를 체육관 카드로 정규화한다", () => {
    const gym = normalizeOsmGym({
      type: "way",
      id: 12,
      center: { lat: 37.55, lon: 127.04 },
      tags: { name: "성수 복싱", "addr:district": "성동구" },
    });

    expect(gym).toMatchObject({
      id: "osm-way-12",
      name: "성수 복싱",
      lat: 37.55,
      lon: 127.04,
      source: "osm",
    });
  });

  it("같은 이름의 OSM 관과 입점관을 하나로 합치고 지도 좌표를 보완한다", () => {
    const merged = mergeGymSearchResults(
      [{ id: "listed-1", name: "성수 복싱", source: "listing" }],
      [
        {
          id: "osm-node-1",
          name: "성수복싱",
          source: "osm",
          lat: 37.55,
          lon: 127.04,
          distanceKm: 1,
        },
      ]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: "listed-1",
      source: "listing",
      lat: 37.55,
      lon: 127.04,
    });
  });

  it("좌표 없는 거리는 계산하지 않고 입점 등록은 지도 선택을 요구한다", () => {
    expect(getDistanceKm(37.5, 127, null, null)).toBeNaN();
    expect(hasMapCoordinates({ lat: null, lon: null })).toBe(false);
    expect(
      validateGymListingForm({
        gymName: "성수 복싱",
        ownerName: "관장",
        phone: "01012345678",
        address: "서울 성동구 성수동",
      }).message
    ).toContain("지도");
  });

  it("검색 반경 밖·좌표 없는 입점관은 지도에 올리지 않는다", () => {
    const center = { lat: 37.5, lon: 127.03 };
    expect(
      isNearbyMapGym({ lat: null, lon: null }, center)
    ).toBe(false);
    expect(
      isNearbyMapGym({ lat: 0, lon: 0 }, center)
    ).toBe(false);
    expect(
      isNearbyMapGym({ lat: 37.51, lon: 127.04 }, center)
    ).toBe(true);
  });

  it("찜한 체육관을 기기에 저장하고 다시 누르면 제거한다", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    });

    toggleFavoriteGym({
      id: "osm-node-1",
      name: "성수 복싱",
      source: "osm",
      lat: 37.55,
      lon: 127.04,
    });
    expect(getFavoriteGyms()).toHaveLength(1);

    toggleFavoriteGym({ id: "osm-node-1", name: "성수 복싱" });
    expect(getFavoriteGyms()).toEqual([]);
  });
});

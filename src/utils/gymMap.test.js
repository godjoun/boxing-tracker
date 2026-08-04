import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeOsmGym,
  normalizePhotonLocation,
} from "../api/osmGymApi";
import {
  getFavoriteGyms,
  toggleFavoriteGym,
} from "./gymFavorites";
import {
  mergeGymSearchResults,
  validateGymListingForm,
} from "./gymListing";
import {
  getDistanceKm,
  getGymSearchCityLabel,
  getListedGymsByCity,
  getUnlocatedListedGyms,
  hasMapCoordinates,
  isNearbyMapGym,
  resolveGpsSearchLocation,
} from "./gymSearch";
import { groupRivalsByArea } from "./rivalAreaMap";

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
    expect(
      isNearbyMapGym(
        { lat: 40.713, lon: -74.006 },
        { lat: 40.7128, lon: -74.006 }
      )
    ).toBe(true);
  });

  it("GPS 좌표를 도시로 표시하고 해당 도시의 승인 입점관만 센다", () => {
    const city = getGymSearchCityLabel({
      lat: 37.51,
      lon: 127.03,
      label: "내 위치",
      source: "gps",
    });
    const gyms = getListedGymsByCity(
      [
        { id: "seoul", source: "listing", address: "서울 강남구 역삼동" },
        {
          id: "coordinate-only",
          source: "listing",
          address: "도로명 확인 중",
          lat: 37.52,
          lon: 127.04,
        },
        { id: "busan", source: "listing", address: "부산 부산진구" },
        {
          id: "pending",
          source: "listing",
          address: "서울 마포구",
          ownerPreview: true,
        },
        { id: "map", source: "osm", address: "서울 송파구" },
      ],
      city,
      { lat: 37.51, lon: 127.03 }
    );

    expect(city).toBe("서울");
    expect(gyms.map((gym) => gym.id)).toEqual(["seoul", "coordinate-only"]);
    expect(
      getGymSearchCityLabel({
        lat: 36.45,
        lon: 127.85,
        label: "대한민국",
        source: "overview",
      })
    ).toBe("현재 지역");
  });

  it("지도 좌표가 없는 승인 입점관을 위치 확인 대상으로 분리한다", () => {
    const unknown = getUnlocatedListedGyms([
      { id: "unknown", source: "listing", address: "", tags: ["입점"] },
      { id: "addressed", source: "listing", address: "서울 마포구" },
      { id: "mapped", source: "listing", lat: 37.5, lon: 127 },
      { id: "osm", source: "osm", address: "" },
    ]);

    expect(unknown.map((gym) => gym.id)).toEqual(["unknown", "addressed"]);
  });

  it("Photon 응답의 해외 도시명을 보존하고 GPS 위치에 적용한다", async () => {
    const feature = {
      geometry: { coordinates: [-74.006, 40.7128] },
      properties: { city: "New York", country: "United States" },
    };
    expect(normalizePhotonLocation(feature)).toMatchObject({
      cityLabel: "New York",
      label: "New York, United States",
    });

    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [feature] }),
    }));

    const location = await resolveGpsSearchLocation({
      lat: 40.7128,
      lon: -74.006,
      label: "내 위치",
      source: "gps",
      accuracy: 20,
    });

    expect(location).toMatchObject({
      cityLabel: "New York",
      countryLabel: "United States",
      source: "gps",
      accuracy: 20,
    });
  });

  it("사용자 장소 제보는 관장 연락처 없이 좌표만으로 접수한다", () => {
    const result = validateGymListingForm({
      submissionKind: "community",
      gymName: "성수 복싱",
      address: "서울 성동구 성수동",
      lat: 37.55,
      lon: 127.04,
    });

    expect(result.ok).toBe(true);
    expect(result.payload).toMatchObject({
      ownerName: "사용자 제보",
      phone: "",
      submissionKind: "community",
    });
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

  it("라이벌은 정확 좌표 없이 같은 활동 권역으로 묶는다", () => {
    const areas = groupRivalsByArea([
      {
        id: "rival-1",
        nickname: "신조운",
        weightClass: "라이트급",
        area: "성수동",
      },
      { id: "rival-2", nickname: "복서B", area: "서울 성수" },
      { id: "rival-3", nickname: "복서C", area: "성수동" },
      { id: "rival-4", nickname: "복서D", area: "성수동" },
      { id: "rival-3", area: "알 수 없는 지역" },
    ]);

    expect(areas).toEqual([
      expect.objectContaining({
        id: "seoul-sungsu",
        label: "서울 성수",
        count: 4,
        profiles: [
          {
            id: "rival-1",
            nickname: "신조운",
            initial: "신",
            weightClass: "라이트급",
          },
          expect.objectContaining({ id: "rival-2", initial: "복" }),
          expect.objectContaining({ id: "rival-3", initial: "복" }),
        ],
      }),
    ]);
  });
});

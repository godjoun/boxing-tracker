import { describe, expect, it } from "vitest";
import {
  filterExchangeEventsByDate,
  filterExchangeEventsByQuery,
  formatExchangeFee,
  formatExchangeSlots,
  isReleaseExcludedExchangeEvent,
} from "./dojoExchange";
import { LOCAL_EXCHANGE_EVENTS } from "../data/localDojoData";

const EVENTS = [
  {
    id: "meeting-a",
    title: "퇴근 후 스파링",
    gymName: "성수 복싱짐",
    address: "서울 성동구",
    note: "마우스피스 지참",
    startsAt: "2026-08-08T05:00:00.000Z",
  },
  {
    id: "meeting-b",
    title: "주말 합동 훈련",
    gymName: "군산 복싱클럽",
    address: "전북 군산시",
    startsAt: "2026-08-09T05:00:00.000Z",
  },
];

describe("모임 게시판 필터", () => {
  it("지역·체육관·제목·안내에서 같은 검색어를 찾는다", () => {
    expect(filterExchangeEventsByQuery(EVENTS, "성수")).toEqual([EVENTS[0]]);
    expect(filterExchangeEventsByQuery(EVENTS, "마우스피스")).toEqual([
      EVENTS[0],
    ]);
    expect(filterExchangeEventsByQuery(EVENTS, "군산")).toEqual([EVENTS[1]]);
  });

  it("선택한 날짜의 모임만 남긴다", () => {
    expect(filterExchangeEventsByDate(EVENTS, "2026-08-08")).toEqual([
      EVENTS[0],
    ]);
  });

  it("목록에 필요한 인원과 참가비 문구를 짧게 표시한다", () => {
    expect(formatExchangeSlots(3, 12)).toBe("3/12명");
    expect(formatExchangeFee(0)).toBe("무료");
    expect(formatExchangeFee(10000)).toBe("10,000원");
  });
});

describe("출시 테스트 콘텐츠 차단", () => {
  it("로컬 시드 예시는 비어 있다", () => {
    expect(LOCAL_EXCHANGE_EVENTS).toEqual([]);
  });

  it("배포 환경에서 확인된 테스트짐을 숨긴다", () => {
    const testEvent = {
      id: "test",
      gymName: "테스트짐",
      address: "서울 테스트동",
      title: "테스트짐 교류",
    };
    expect(isReleaseExcludedExchangeEvent(testEvent, { isDev: false })).toBe(
      true
    );
    expect(isReleaseExcludedExchangeEvent(EVENTS[0], { isDev: false })).toBe(
      false
    );
  });

  it("개발 환경에서는 테스트 일정을 남겨 QA할 수 있다", () => {
    const testEvent = {
      gymName: "테스트짐",
      address: "서울 테스트동",
    };
    expect(isReleaseExcludedExchangeEvent(testEvent, { isDev: true })).toBe(
      false
    );
  });
});

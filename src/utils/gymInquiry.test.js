import { describe, expect, it } from "vitest";
import {
  displayInquiryMemo,
  inquiryKindLabel,
  isExchangeProposalMemo,
  withExchangeProposalMemo,
} from "./gymInquiry";

describe("체육관 교류 제안 문의", () => {
  it("기존 예약 형식을 유지하면서 교류 제안으로 구분한다", () => {
    const memo = withExchangeProposalMemo("웰터급 합동훈련을 제안합니다.");

    expect(isExchangeProposalMemo(memo)).toBe(true);
    expect(inquiryKindLabel("reservation", memo)).toBe("교류 제안");
    expect(displayInquiryMemo(memo)).toBe("웰터급 합동훈련을 제안합니다.");
  });

  it("빈 메시지도 교류 제안 표식을 보존한다", () => {
    const memo = withExchangeProposalMemo("");

    expect(memo).toBe("[교류 제안]");
    expect(inquiryKindLabel("reservation", memo)).toBe("교류 제안");
    expect(displayInquiryMemo(memo)).toBe("");
  });

  it("기존 문의 라벨과 메모는 바꾸지 않는다", () => {
    expect(inquiryKindLabel("trial", "첫 방문 문의")).toBe("체험");
    expect(inquiryKindLabel("rental", "링 대여")).toBe("대여");
    expect(displayInquiryMemo("기존 메모")).toBe("기존 메모");
  });
});

export const RELEASE_SCOPE = Object.freeze({
  /** 차단·신고·동의 운영 전까지 공개 출시에서 숨김 (코드는 Level 3용으로 유지) */
  rivals: false,
  /**
   * 입점·문의·모임·DM·라이벌 서버.
   * Auth/RLS 개선 전 출시 1차에서 끔. 코드·SQL 자산은 유지한다.
   */
  dojoServer: false,
});

export function isDojoServerEnabled() {
  return RELEASE_SCOPE.dojoServer === true;
}

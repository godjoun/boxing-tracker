/** 체육관 이용권·대여 가격 표시 (문의 전 참고용) */
export function formatWon(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 10000 && n % 10000 === 0) {
    return `${(n / 10000).toLocaleString("ko-KR")}만원`;
  }
  return `${n.toLocaleString("ko-KR")}원`;
}

export function getGymPassLines(gym) {
  if (!gym) return [];

  const lines = [];
  const day = formatWon(gym.dayPassWon);
  const month = formatWon(gym.monthPassWon);
  const rental = formatWon(gym.rentalHourWon);

  if (day) lines.push({ key: "day", label: "일일", value: day });
  if (month) lines.push({ key: "month", label: "한달", value: month });
  if (rental) lines.push({ key: "rental", label: "대여/시간", value: rental });

  if (lines.length === 0) {
    lines.push({ key: "ask", label: "가격", value: "문의" });
  }

  return lines;
}

/**
 * @file time.ts
 * @description 시간 관련 유틸리티 함수
 *
 * 상대 시간 표시 함수를 제공합니다.
 */

/**
 * 상대 시간을 표시합니다.
 * 예: "방금 전", "3분 전", "1시간 전", "3일 전", "2024.12.08"
 *
 * @param date ISO timestamp 문자열
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  // 방금 전 (1분 미만)
  if (diffInSeconds < 60) {
    return "방금 전";
  }

  // 분 전 (1시간 미만)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  // 시간 전 (24시간 미만)
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 일 전 (7일 미만)
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  // 그 외: 날짜 형식으로 표시
  return postDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}


/**
 * @file lib/utils/network.ts
 * @description 네트워크 관련 유틸리티 함수
 *
 * 네트워크 상태 확인, 재시도 로직, 타임아웃 처리 등을 제공합니다.
 */

import { NetworkError } from "./error";

/**
 * 네트워크 연결 상태 확인
 */
export function checkNetworkStatus(): boolean {
  if (typeof window === "undefined") {
    return true; // 서버 사이드에서는 항상 true
  }
  return navigator.onLine;
}

/**
 * 네트워크 상태 변경 이벤트 리스너 등록
 */
export function onNetworkStatusChange(
  callback: (isOnline: boolean) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {}; // 서버 사이드에서는 빈 함수 반환
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * fetch 요청에 타임아웃 적용
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new NetworkError("요청 시간이 초과되었습니다.");
    }
    throw error;
  }
}

/**
 * 재시도 로직이 포함된 fetch 요청
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 네트워크 상태 확인
      if (!checkNetworkStatus()) {
        throw new NetworkError("네트워크 연결이 없습니다.");
      }

      const response = await fetchWithTimeout(url, options);

      // 성공적인 응답 (2xx, 3xx)
      if (response.ok || response.status < 400) {
        return response;
      }

      // 4xx 에러는 재시도하지 않음 (클라이언트 에러)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // 5xx 에러는 재시도
      lastError = new Error(`서버 오류: ${response.status}`);
    } catch (error: any) {
      lastError = error;

      // 마지막 시도가 아니면 재시도
      if (attempt < maxRetries) {
        // 지수 백오프 (exponential backoff)
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new NetworkError("요청에 실패했습니다.");
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("fetch") ||
      error.message.includes("Failed to fetch") ||
      error.name === "NetworkError" ||
      error.name === "TypeError"
    );
  }

  return false;
}


/**
 * @file lib/utils/error.ts
 * @description 에러 타입 정의 및 유틸리티 함수
 *
 * API 에러, 네트워크 에러, 검증 에러 등을 처리하기 위한 타입과 유틸리티 함수를 제공합니다.
 */

/**
 * API 에러 클래스
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * 네트워크 에러 클래스
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * 검증 에러 클래스
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 에러 타입 가드 함수
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * 사용자 친화적인 에러 메시지로 변환
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return getAPIErrorMessage(error.statusCode, error.message);
  }

  if (isNetworkError(error)) {
    return "네트워크 연결을 확인해주세요.";
  }

  if (isValidationError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    // 개발 환경에서는 원본 메시지 표시
    if (process.env.NODE_ENV === "development") {
      return error.message;
    }
    // 프로덕션 환경에서는 일반적인 메시지 표시
    return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * HTTP 상태 코드에 따른 사용자 친화적 에러 메시지 반환
 */
function getAPIErrorMessage(statusCode: number, defaultMessage: string): string {
  switch (statusCode) {
    case 400:
      return "잘못된 요청입니다. 입력한 내용을 확인해주세요.";
    case 401:
      return "로그인이 필요합니다.";
    case 403:
      return "권한이 없습니다.";
    case 404:
      return "요청한 내용을 찾을 수 없습니다.";
    case 409:
      return "이미 처리된 요청입니다.";
    case 413:
      return "파일 크기가 너무 큽니다.";
    case 422:
      return "입력한 내용이 올바르지 않습니다.";
    case 429:
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    case 500:
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    case 503:
      return "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
    default:
      return defaultMessage || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

/**
 * 에러 로깅 (개발 환경에서만 상세 로그)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Error${context ? ` - ${context}` : ""}]`, error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  } else {
    // 프로덕션 환경에서는 간단한 로그만
    console.error(`[Error${context ? ` - ${context}` : ""}]`, error instanceof Error ? error.message : String(error));
  }
}

/**
 * 에러를 APIError로 변환
 */
export function toAPIError(error: unknown, defaultStatusCode = 500): APIError {
  if (isAPIError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new APIError(error.message, defaultStatusCode);
  }

  return new APIError("알 수 없는 오류가 발생했습니다.", defaultStatusCode);
}


"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/utils/error";

/**
 * @file ErrorBoundary.tsx
 * @description 전역 에러 바운더리 컴포넌트
 *
 * React 컴포넌트 트리에서 발생하는 에러를 캐치하고 폴백 UI를 표시합니다.
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logError(error, "ErrorBoundary");
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-instagram-background">
          <div className="max-w-md w-full bg-white border border-instagram-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-instagram-bold text-instagram-text-primary mb-4">
              오류가 발생했습니다
            </h2>
            <p className="text-instagram-sm text-instagram-text-secondary mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-left">
                <p className="text-xs text-red-600 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-instagram-blue text-white hover:bg-blue-600"
              >
                다시 시도
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                페이지 새로고침
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


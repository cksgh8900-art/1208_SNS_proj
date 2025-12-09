"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentWithUser } from "@/lib/types";

/**
 * @file CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * 기능:
 * - 댓글 입력
 * - Enter 키로 제출 (Shift+Enter는 줄바꿈)
 * - 제출 버튼으로 제출
 * - 제출 후 입력 필드 초기화
 * - 에러 처리
 */

interface CommentFormProps {
  postId: string;
  onSubmit?: (comment: CommentWithUser) => void; // 제출 성공 콜백
  placeholder?: string; // Placeholder 텍스트
  autoFocus?: boolean; // 자동 포커스
}

export default function CommentForm({
  postId,
  onSubmit,
  placeholder = "댓글 달기...",
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 포커스
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // 댓글 내용 검증
  const validateComment = useCallback(
    (text: string): { valid: boolean; error?: string } => {
      const trimmed = text.trim();

      if (trimmed.length === 0) {
        return { valid: false, error: "댓글을 입력해주세요." };
      }

      return { valid: true };
    },
    []
  );

  // 댓글 제출
  const handleSubmit = useCallback(async () => {
    // 검증
    const validation = validateComment(content);
    if (!validation.valid) {
      setError(validation.error || "댓글을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "댓글 작성 중 오류가 발생했습니다.");
      }

      if (data.data) {
        // 입력 필드 초기화
        setContent("");

        // 콜백 호출
        if (onSubmit) {
          onSubmit(data.data);
        }
      }
        } catch (err: any) {
          logError(err, "댓글 작성");
          const errorMessage = getUserFriendlyErrorMessage(err);
          setError(errorMessage);
        } finally {
      setSubmitting(false);
    }
  }, [content, postId, onSubmit, validateComment]);

  // Enter 키 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (content.trim() && !submitting) {
          handleSubmit();
        }
      }
    },
    [content, submitting, handleSubmit]
  );

  // 입력 내용 변경
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      setError(null);
    },
    []
  );

  const canSubmit = content.trim().length > 0 && !submitting;

  return (
    <div className="px-4 py-3 border-t border-instagram-border">
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-instagram-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 입력 필드 */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="resize-none min-h-[40px] max-h-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-2 text-instagram-sm"
            disabled={submitting}
          />
        </div>

        {/* 제출 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 h-auto bg-transparent hover:bg-transparent text-instagram-blue disabled:text-instagram-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="댓글 게시"
        >
          {submitting ? (
            <span className="text-instagram-sm">게시 중...</span>
          ) : (
            <span className="text-instagram-sm font-instagram-semibold">
              게시
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}


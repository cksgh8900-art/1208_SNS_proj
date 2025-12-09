"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/time";
import type { CommentWithUser } from "@/lib/types";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error";

/**
 * @file CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * 기능:
 * - 댓글 목록 렌더링
 * - 최신 댓글부터 표시
 * - maxDisplay 개수만큼만 표시 (나머지는 "모두 보기" 버튼)
 * - 삭제 버튼 표시 (본인만)
 * - 댓글 삭제 처리
 */

interface CommentListProps {
  postId: string;
  initialComments?: CommentWithUser[]; // 초기 댓글 (SSR용)
  maxDisplay?: number; // 최대 표시 개수 (PostCard: 2, 상세: 전체)
  showDeleteButton?: boolean; // 삭제 버튼 표시 여부
  currentUserId?: string; // 현재 사용자 Clerk ID (삭제 버튼 표시용)
  onCommentDelete?: (commentId: string) => void; // 댓글 삭제 콜백
}

export default function CommentList({
  postId,
  initialComments,
  maxDisplay,
  showDeleteButton = true,
  currentUserId,
  onCommentDelete,
}: CommentListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(
    initialComments || []
  );
  const [loading, setLoading] = useState(!initialComments);
  const [error, setError] = useState<string | null>(null);

  // 댓글 로드
  useEffect(() => {
    if (!initialComments) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const limit = maxDisplay || 50;
      const response = await fetch(
        `/api/comments?postId=${postId}&limit=${limit}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "댓글을 불러오는 중 오류가 발생했습니다.");
      }

      if (data.data) {
        setComments(data.data);
      }
    } catch (err: any) {
      console.error("댓글 로드 에러:", err);
      setError(err.message || "댓글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 댓글 삭제
  const handleDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "댓글 삭제 중 오류가 발생했습니다.");
      }

      // 목록에서 제거
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      // 콜백 호출
      if (onCommentDelete) {
        onCommentDelete(commentId);
      }
    } catch (err: any) {
      console.error("댓글 삭제 에러:", err);
      alert(err.message || "댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  // 표시할 댓글 (maxDisplay가 있으면 제한) - useMemo로 최적화
  const displayComments = useMemo(() => {
    return maxDisplay ? comments.slice(0, maxDisplay) : comments;
  }, [comments, maxDisplay]);
  
  const hasMore = useMemo(() => {
    return maxDisplay ? comments.length > maxDisplay : false;
  }, [comments.length, maxDisplay]);

  if (loading && comments.length === 0) {
    return (
      <div className="px-4 pb-3">
        <p className="text-instagram-sm text-instagram-text-secondary">
          댓글을 불러오는 중...
        </p>
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className="px-4 pb-3">
        <p className="text-instagram-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-3">
      {/* "댓글 N개 모두 보기" 버튼 */}
      {hasMore && (
        <button
          className="text-instagram-sm text-instagram-text-secondary hover:text-instagram-text-primary mb-2"
          onClick={() => {
            // 나중에 댓글 상세 모달 구현
            alert("댓글 상세 기능은 곧 추가될 예정입니다.");
          }}
        >
          댓글 {comments.length}개 모두 보기
        </button>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-1">
        {displayComments.map((comment) => {
          const userName = comment.user?.name || "알 수 없음";
          // currentUserId는 Clerk ID이므로 user.clerk_id와 비교
          const isOwner = currentUserId && comment.user?.clerk_id === currentUserId;

          return (
            <div
              key={comment.id}
              className="flex items-start gap-2 group hover:bg-gray-50 rounded px-1 -mx-1"
            >
              <div className="flex-1 min-w-0">
                <p className="text-instagram-sm text-instagram-text-primary">
                  <Link
                    href={`/profile/${comment.user?.id || ""}`}
                    className="font-instagram-bold hover:opacity-70"
                  >
                    {userName}
                  </Link>{" "}
                  <span>{comment.content}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-instagram-xs text-instagram-text-secondary">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
              </div>

              {/* 삭제 버튼 (본인만 표시) */}
              {showDeleteButton && isOwner && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500"
                  aria-label="댓글 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


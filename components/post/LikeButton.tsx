"use client";

import React, { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Heart } from "lucide-react";

/**
 * @file LikeButton.tsx
 * @description 좋아요 버튼 컴포넌트
 *
 * 기능:
 * - 빈 하트 ↔ 빨간 하트 상태 관리
 * - 클릭 애니메이션 (scale 1.3 → 1, 0.15초)
 * - 좋아요 API 호출
 * - Optimistic UI 업데이트
 * - 로딩 상태 관리
 * - 에러 처리
 */

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialLikesCount: number;
  onLikeChange?: (liked: boolean, likesCount: number) => void;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export interface LikeButtonHandle {
  handleLike: () => void;
}

const LikeButton = forwardRef<LikeButtonHandle, LikeButtonProps>(function LikeButton(
  {
    postId,
    initialLiked,
    initialLikesCount,
    onLikeChange,
    size = "md",
    showCount = false,
  },
  ref
) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleLike = useCallback(async () => {
    // 이미 로딩 중이면 무시
    if (loading) return;

    // Optimistic 업데이트
    const previousLiked = liked;
    const previousCount = likesCount;

    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    setAnimating(true);
    setLoading(true);

    // 애니메이션 완료 대기
    setTimeout(() => {
      setAnimating(false);
    }, 150);

    try {
      const response = await fetch("/api/likes", {
        method: liked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "좋아요 처리 중 오류가 발생했습니다.");
      }

      // 성공 시 서버에서 받은 좋아요 수로 업데이트
      if (data.data?.likesCount !== undefined) {
        setLikesCount(data.data.likesCount);
      }

      // 콜백 호출
      if (onLikeChange) {
        onLikeChange(!liked, data.data?.likesCount || likesCount);
      }
    } catch (error: any) {
      console.error("좋아요 처리 에러:", error);
      
      // 실패 시 롤백
      setLiked(previousLiked);
      setLikesCount(previousCount);

      // 에러 메시지 표시 (선택사항)
      // alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [liked, likesCount, loading, postId, onLikeChange]);

  // ref를 통해 외부에서 handleLike 호출 가능하도록
  useImperativeHandle(ref, () => ({
    handleLike,
  }));

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`p-1 hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
          animating ? "scale-125" : "scale-100"
        } transition-transform duration-150`}
        aria-label={liked ? "좋아요 취소" : "좋아요"}
      >
        <Heart
          className={`${sizeMap[size]} ${
            liked
              ? "fill-instagram-like text-instagram-like"
              : "text-instagram-text-primary"
          } transition-colors duration-150`}
        />
      </button>
      {showCount && likesCount > 0 && (
        <span className="text-instagram-sm font-instagram-bold text-instagram-text-primary">
          {likesCount.toLocaleString()}
        </span>
      )}
    </div>
  );
});

LikeButton.displayName = "LikeButton";

export default LikeButton;


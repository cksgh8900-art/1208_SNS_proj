"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ApiResponse } from "@/lib/types";

/**
 * @file FollowButton.tsx
 * @description 팔로우 버튼 컴포넌트
 *
 * 기능:
 * - "팔로우" / "팔로잉" 버튼 상태 관리
 * - Hover 시 "언팔로우" 표시 (팔로우 중 상태)
 * - 팔로우 API 호출
 * - Optimistic UI 업데이트
 * - 로딩 상태 관리
 * - 에러 처리 및 롤백
 */

interface FollowButtonProps {
  followingId: string; // 팔로우할 사용자의 Supabase user_id
  initialFollowing: boolean; // 초기 팔로우 상태
  initialFollowersCount: number; // 초기 팔로워 수
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void; // 팔로우 상태 변경 콜백
  size?: "sm" | "md" | "lg"; // 버튼 크기
}

const sizeMap = {
  sm: "text-xs px-3 py-1.5",
  md: "text-instagram-sm px-4 py-2",
  lg: "text-base px-6 py-3",
};

export default function FollowButton({
  followingId,
  initialFollowing,
  initialFollowersCount,
  onFollowChange,
  size = "md",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [loading, setLoading] = useState(false);

  const handleFollow = useCallback(async () => {
    // 이미 로딩 중이면 무시
    if (loading) return;

    // Optimistic 업데이트
    const previousFollowing = isFollowing;
    const previousCount = followersCount;

    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
    setLoading(true);

    try {
      const response = await fetch("/api/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId }),
      });

      const data: ApiResponse<{ followersCount: number }> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "팔로우 처리 중 오류가 발생했습니다.");
      }

      // 성공 시 서버에서 받은 팔로워 수로 업데이트
      if (data.data?.followersCount !== undefined) {
        setFollowersCount(data.data.followersCount);
      }

      // 콜백 호출
      if (onFollowChange) {
        onFollowChange(!isFollowing, data.data?.followersCount || followersCount);
      }
    } catch (error: any) {
      console.error("팔로우 처리 에러:", error);
      
      // 실패 시 롤백
      setIsFollowing(previousFollowing);
      setFollowersCount(previousCount);

      // 에러 메시지 표시 (선택사항)
      // alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [isFollowing, followersCount, loading, followingId, onFollowChange]);

  return (
    <div className="group">
      <Button
        onClick={handleFollow}
        disabled={loading}
        className={`
          ${sizeMap[size]} font-instagram-semibold transition-colors
          ${
            isFollowing
              ? "bg-gray-200 text-instagram-text-primary hover:bg-red-50 hover:text-red-500 hover:border-red-500 border border-transparent"
              : "bg-instagram-blue text-white hover:bg-blue-600"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={isFollowing ? "언팔로우" : "팔로우"}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isFollowing ? "언팔로우 중..." : "팔로우 중..."}
          </>
        ) : (
          <>
            <span className="group-hover:hidden">
              {isFollowing ? "팔로잉" : "팔로우"}
            </span>
            {isFollowing && (
              <span className="hidden group-hover:inline text-red-500">
                언팔로우
              </span>
            )}
          </>
        )}
      </Button>
    </div>
  );
}


"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { UserWithStats } from "@/lib/types";

/**
 * @file ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * 기능:
 * - 프로필 이미지 및 사용자명 표시
 * - 통계 표시 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 팔로우 버튼 (다른 사람 프로필)
 * - 프로필 편집 버튼 (본인 프로필, 1차 제외)
 */

interface ProfileHeaderProps {
  user: UserWithStats;
  isOwnProfile: boolean; // 본인 프로필 여부
  currentUserId?: string; // 현재 사용자 Clerk ID
  onFollowChange?: (isFollowing: boolean) => void; // 팔로우 상태 변경 콜백
}

export default function ProfileHeader({
  user,
  isOwnProfile,
  currentUserId,
  onFollowChange,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [followersCount, setFollowersCount] = useState(user.followers_count);
  const gridRef = useRef<HTMLDivElement>(null);

  const userInitials = user.name.charAt(0).toUpperCase();

  // 통계 클릭 핸들러
  const handlePostsClick = () => {
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFollowersClick = () => {
    alert("팔로워 목록 기능은 곧 추가될 예정입니다.");
  };

  const handleFollowingClick = () => {
    alert("팔로잉 목록 기능은 곧 추가될 예정입니다.");
  };

  // 팔로우 버튼 클릭 핸들러 (1차에서는 UI만, 실제 기능은 다음 단계)
  const handleFollowClick = () => {
    if (isFollowing) {
      // 언팔로우 (1차에서는 UI만)
      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
      if (onFollowChange) {
        onFollowChange(false);
      }
      alert("언팔로우 기능은 곧 추가될 예정입니다.");
    } else {
      // 팔로우 (1차에서는 UI만)
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      if (onFollowChange) {
        onFollowChange(true);
      }
      alert("팔로우 기능은 곧 추가될 예정입니다.");
    }
  };

  return (
    <div className="w-full px-4 py-6 md:px-0">
      <div className="flex flex-col md:flex-row md:items-start md:gap-8">
        {/* 프로필 이미지 */}
        <div className="flex justify-center md:justify-start mb-4 md:mb-0">
          <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full bg-gray-200 flex items-center justify-center text-instagram-text-primary text-2xl md:text-4xl font-instagram-bold">
            {userInitials}
          </div>
        </div>

        {/* 사용자 정보 및 통계 */}
        <div className="flex-1">
          {/* 사용자명 및 액션 버튼 */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-instagram-normal text-instagram-text-primary mb-3 md:mb-0">
              {user.name}
            </h1>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  className="text-instagram-sm font-instagram-semibold"
                  onClick={() => {
                    alert("프로필 편집 기능은 곧 추가될 예정입니다. (Clerk 설정 사용)");
                  }}
                >
                  프로필 편집
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleFollowClick}
                    className={`text-instagram-sm font-instagram-semibold ${
                      isFollowing
                        ? "bg-gray-200 text-instagram-text-primary hover:bg-red-50 hover:text-red-500 hover:border-red-500"
                        : "bg-instagram-blue text-white hover:bg-blue-600"
                    }`}
                  >
                    {isFollowing ? "팔로잉" : "팔로우"}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-instagram-sm font-instagram-semibold"
                    onClick={() => {
                      alert("메시지 기능은 곧 추가될 예정입니다.");
                    }}
                  >
                    메시지
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-6 mb-4">
            <button
              onClick={handlePostsClick}
              className="text-instagram-sm text-instagram-text-primary hover:opacity-70"
            >
              <span className="font-instagram-bold">{user.posts_count}</span> 게시물
            </button>
            <button
              onClick={handleFollowersClick}
              className="text-instagram-sm text-instagram-text-primary hover:opacity-70"
            >
              <span className="font-instagram-bold">{followersCount}</span> 팔로워
            </button>
            <button
              onClick={handleFollowingClick}
              className="text-instagram-sm text-instagram-text-primary hover:opacity-70"
            >
              <span className="font-instagram-bold">{user.following_count}</span> 팔로잉
            </button>
          </div>

          {/* 사용자명 (이름) */}
          <div className="mb-2">
            <p className="text-instagram-sm font-instagram-semibold text-instagram-text-primary">
              {user.name}
            </p>
          </div>

          {/* 소개 (1차 제외) */}
          {/* <div>
            <p className="text-instagram-sm text-instagram-text-primary">
              {user.bio || "소개가 없습니다."}
            </p>
          </div> */}
        </div>
      </div>

      {/* PostGrid로 스크롤하기 위한 ref */}
      <div ref={gridRef} className="h-0" />
    </div>
  );
}


"use client";

import { useState, useEffect, useRef } from "react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import type { PostWithStats } from "@/lib/types";

/**
 * @file PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 게시물 목록을 렌더링하고 무한 스크롤을 제공합니다.
 *
 * 기능:
 * - 게시물 목록 렌더링
 * - 무한 스크롤 (Intersection Observer)
 * - 페이지네이션 (10개씩)
 * - 로딩 상태 관리
 * - 에러 처리
 */

interface PostFeedProps {
  userId?: string; // 특정 사용자의 게시물만 표시 (프로필 페이지용)
  initialPosts?: PostWithStats[]; // 초기 게시물 (SSR용, 선택사항)
}

export default function PostFeed({ userId, initialPosts }: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithStats[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(initialPosts?.length || 0);
  const observerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const limit = 10;

  // 게시물 로드 함수
  const loadPosts = async (currentOffset: number) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      if (userId) {
        params.append("userId", userId);
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "게시물을 불러오는 중 오류가 발생했습니다.");
      }

      if (data.data && data.data.length > 0) {
        setPosts((prev) => [...prev, ...data.data]);
        setHasMore(data.hasMore);
        setOffset(currentOffset + data.data.length);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("게시물 로드 에러:", err);
      setError(err.message || "게시물을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 초기 로드
  useEffect(() => {
    if (!initialPosts) {
      loadPosts(0);
    }
  }, []);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingRef.current) {
          loadPosts(offset);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasMore, loading, offset, userId]);

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-instagram-sm text-instagram-text-secondary mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadPosts(0);
          }}
          className="px-4 py-2 bg-instagram-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 빈 상태
  if (!loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-instagram-sm text-instagram-text-secondary">
          게시물이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 게시물 목록 */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* 로딩 Skeleton */}
      {loading && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}

      {/* Intersection Observer 대상 요소 */}
      {hasMore && !loading && (
        <div ref={observerRef} className="h-1" aria-hidden="true" />
      )}

      {/* 에러 메시지 (게시물이 있는 경우) */}
      {error && posts.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <p className="text-instagram-sm text-instagram-text-secondary mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadPosts(offset);
            }}
            className="px-4 py-2 bg-instagram-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-instagram-sm"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}


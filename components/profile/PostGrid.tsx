"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import type { PostWithStats } from "@/lib/types";
import PostModal from "@/components/post/PostModal";

/**
 * @file PostGrid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * 기능:
 * - 3열 그리드 레이아웃 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 표시 (Desktop)
 * - 클릭 시 게시물 상세 모달 열기
 */

interface PostGridProps {
  userId: string; // Supabase user_id
  initialPosts?: PostWithStats[]; // 초기 게시물 (SSR용)
  onPostClick?: (post: PostWithStats) => void; // 게시물 클릭 콜백
  onPostDelete?: (postId: string) => void; // 게시물 삭제 콜백
}

export default function PostGrid({
  userId,
  initialPosts,
  onPostClick,
  onPostDelete,
}: PostGridProps) {
  const [posts, setPosts] = useState<PostWithStats[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  // 게시물 로드
  useEffect(() => {
    if (!initialPosts && userId) {
      loadPosts();
    }
  }, [userId]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts?userId=${userId}&limit=100&offset=0`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "게시물을 불러오는 중 오류가 발생했습니다.");
      }

      if (data.data) {
        setPosts(data.data);
      }
    } catch (err: any) {
      console.error("게시물 로드 에러:", err);
      setError(err.message || "게시물을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 게시물 클릭 핸들러
  const handlePostClick = (post: PostWithStats) => {
    setSelectedPostId(post.id);
    setPostModalOpen(true);
    if (onPostClick) {
      onPostClick(post);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-instagram-sm text-red-500 mb-4">{error}</p>
        <button
          onClick={loadPosts}
          className="text-instagram-sm text-instagram-blue hover:opacity-70"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-instagram-sm text-instagram-text-secondary">
          게시물이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 탭 메뉴 (1차에서는 게시물만) */}
      <div className="w-full border-t border-instagram-border">
        <div className="flex items-center justify-center gap-16">
          <button className="flex items-center gap-2 py-4 border-t-2 border-instagram-text-primary">
            <span className="text-instagram-xs uppercase tracking-wider font-instagram-semibold text-instagram-text-primary">
              게시물
            </span>
          </button>
          <button
            className="flex items-center gap-2 py-4 border-t-2 border-transparent opacity-50 cursor-not-allowed"
            disabled
          >
            <span className="text-instagram-xs uppercase tracking-wider font-instagram-semibold text-instagram-text-secondary">
              릴스
            </span>
          </button>
          <button
            className="flex items-center gap-2 py-4 border-t-2 border-transparent opacity-50 cursor-not-allowed"
            disabled
          >
            <span className="text-instagram-xs uppercase tracking-wider font-instagram-semibold text-instagram-text-secondary">
              태그됨
            </span>
          </button>
        </div>
      </div>

      {/* 게시물 그리드 */}
      <div className="w-full">
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative aspect-square bg-gray-100 cursor-pointer overflow-hidden"
              onClick={() => handlePostClick(post)}
            >
              <Image
                src={post.image_url}
                alt={post.caption || "게시물"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 210px"
                loading="lazy"
              />
              {/* Hover 오버레이 (Desktop) */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-white">
                  <Heart className="w-5 h-5 fill-white" />
                  <span className="text-instagram-sm font-instagram-bold">
                    {post.likes_count}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span className="text-instagram-sm font-instagram-bold">
                    {post.comments_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PostModal */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          open={postModalOpen}
          onOpenChange={setPostModalOpen}
          posts={posts}
          onPostChange={(newPost) => {
            // 게시물 변경 시 목록 업데이트
            setPosts((prev) =>
              prev.map((p) => (p.id === newPost.id ? newPost : p))
            );
          }}
          onPostDelete={(postId) => {
            // 게시물 삭제 시 목록에서 제거
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setPostModalOpen(false);
            if (onPostDelete) {
              onPostDelete(postId);
            }
          }}
        />
      )}
    </>
  );
}


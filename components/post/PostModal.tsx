"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, MessageCircle, Send, Bookmark, MoreHorizontal, Heart, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/time";
import type { PostWithStats } from "@/lib/types";
import LikeButton, { type LikeButtonHandle } from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import { useAuth } from "@clerk/nextjs";

/**
 * @file PostModal.tsx
 * @description 게시물 상세 모달 컴포넌트
 *
 * 기능:
 * - Desktop: 모달 형식 (이미지 50% + 댓글 50%)
 * - Mobile: 전체 페이지로 전환
 * - 게시물 상세 정보 표시
 * - 댓글 전체 목록 표시
 * - 댓글 작성 및 삭제
 * - 좋아요 기능
 * - 이전/다음 게시물 네비게이션 (Desktop)
 */

interface PostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPost?: PostWithStats; // 초기 게시물 데이터 (선택사항)
  posts?: PostWithStats[]; // 게시물 목록 (이전/다음 네비게이션용)
  onPostChange?: (post: PostWithStats) => void; // 게시물 변경 콜백
  onPostDelete?: (postId: string) => void; // 게시물 삭제 콜백
}

export default function PostModal({
  postId,
  open,
  onOpenChange,
  initialPost,
  posts = [],
  onPostChange,
  onPostDelete,
}: PostModalProps) {
  const { userId: clerkUserId } = useAuth();
  const [currentPostId, setCurrentPostId] = useState(postId);
  
  // 삭제 관련 상태
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [post, setPost] = useState<PostWithStats | null>(initialPost || null);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(initialPost?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(initialPost?.is_liked || false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const likeButtonRef = useRef<LikeButtonHandle>(null);
  const lastTapRef = useRef(0);

  // postId prop 변경 시 currentPostId 업데이트
  useEffect(() => {
    setCurrentPostId(postId);
  }, [postId]);

  // 현재 게시물의 인덱스 찾기
  const currentIndex = posts.findIndex((p) => p.id === currentPostId);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  // 게시물 로드
  useEffect(() => {
    if (open && currentPostId) {
      // posts 목록에서 게시물 찾기
      const foundPost = posts.find((p) => p.id === currentPostId);
      if (foundPost) {
        setPost(foundPost);
        setLikesCount(foundPost.likes_count);
        setIsLiked(foundPost.is_liked || false);
        setError(null);
      } else if (initialPost && initialPost.id === currentPostId) {
        // initialPost가 현재 postId와 일치하는 경우
        setPost(initialPost);
        setLikesCount(initialPost.likes_count);
        setIsLiked(initialPost.is_liked || false);
        setError(null);
      } else if (posts.length === 0) {
        // 목록이 없으면 API 호출
        loadPost();
      } else {
        setError("게시물을 찾을 수 없습니다.");
      }
    }
  }, [open, currentPostId, initialPost, posts]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);

    try {
      // 기존 /api/posts API 활용하여 게시물 조회
      const response = await fetch(`/api/posts?limit=100&offset=0`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "게시물을 불러오는 중 오류가 발생했습니다.");
      }

      if (data.data) {
        const foundPost = data.data.find((p: PostWithStats) => p.id === currentPostId);
        if (foundPost) {
          setPost(foundPost);
          setLikesCount(foundPost.likes_count);
          setIsLiked(foundPost.is_liked || false);
        } else {
          setError("게시물을 찾을 수 없습니다.");
        }
      }
    } catch (err: any) {
      console.error("게시물 로드 에러:", err);
      setError(err.message || "게시물을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이전 게시물로 이동
  const handlePrevPost = useCallback(() => {
    if (prevPost) {
      setCurrentPostId(prevPost.id);
      setPost(prevPost);
      setLikesCount(prevPost.likes_count);
      setIsLiked(prevPost.is_liked || false);
      setError(null);
      if (onPostChange) {
        onPostChange(prevPost);
      }
    }
  }, [prevPost, onPostChange]);

  // 다음 게시물로 이동
  const handleNextPost = useCallback(() => {
    if (nextPost) {
      setCurrentPostId(nextPost.id);
      setPost(nextPost);
      setLikesCount(nextPost.likes_count);
      setIsLiked(nextPost.is_liked || false);
      setError(null);
      if (onPostChange) {
        onPostChange(nextPost);
      }
    }
  }, [nextPost, onPostChange]);

  // 더블탭 좋아요 처리
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked && likeButtonRef.current) {
        likeButtonRef.current.handleLike();
        setShowBigHeart(true);
        setTimeout(() => {
          setShowBigHeart(false);
        }, 1000);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [isLiked]);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((liked: boolean, newLikesCount: number) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
  }, []);

  // 댓글 작성 후 댓글 수 업데이트
  const handleCommentSubmit = useCallback(() => {
    if (post) {
      setPost({
        ...post,
        comments_count: post.comments_count + 1,
      });
    }
  }, [post]);

  // 댓글 삭제 후 댓글 수 업데이트
  const handleCommentDelete = useCallback(() => {
    if (post) {
      setPost({
        ...post,
        comments_count: Math.max(0, post.comments_count - 1),
      });
    }
  }, [post]);

  if (!open) return null;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0">
          <div className="flex items-center justify-center h-[600px]">
            <p className="text-instagram-sm text-instagram-text-secondary">
              게시물을 불러오는 중...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !post) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0">
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <p className="text-instagram-sm text-red-500 mb-4">{error || "게시물을 찾을 수 없습니다."}</p>
              <button
                onClick={() => onOpenChange(false)}
                className="text-instagram-sm text-instagram-blue hover:opacity-70"
              >
                닫기
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const user = post.user;
  const userName = user?.name || "알 수 없음";
  const userInitials = userName.charAt(0).toUpperCase();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] p-0 overflow-hidden md:flex-row md:h-auto">
        {/* Desktop: 이미지 영역 (50%) */}
        <div className="hidden md:flex md:w-1/2 md:relative md:bg-black md:items-center md:justify-center">
          {/* 이전 버튼 */}
          {prevPost && (
            <button
              onClick={handlePrevPost}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              aria-label="이전 게시물"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* 이미지 */}
          <div
            className="relative w-full h-full min-h-[600px]"
            onDoubleClick={handleDoubleTap}
            onTouchEnd={handleDoubleTap}
          >
            <Image
              src={post.image_url}
              alt={post.caption || `${userName}의 게시물`}
              fill
              className="object-contain transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              onLoad={() => {
                // 이미지 로딩 완료 시 페이드 인 효과는 CSS transition으로 처리됨
              }}
            />
            {/* 더블탭 큰 하트 애니메이션 */}
            {showBigHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Heart className="w-24 h-24 fill-white text-white animate-fade-in-out-heart" />
              </div>
            )}
          </div>

          {/* 다음 버튼 */}
          {nextPost && (
            <button
              onClick={handleNextPost}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              aria-label="다음 게시물"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Mobile: 이미지 영역 (전체 너비) */}
        <div className="md:hidden relative w-full aspect-square bg-black">
          <Image
            src={post.image_url}
            alt={post.caption || `${userName}의 게시물`}
            fill
            className="object-contain transition-opacity duration-300"
            sizes="100vw"
            priority
            onLoad={() => {
              // 이미지 로딩 완료 시 페이드 인 효과는 CSS transition으로 처리됨
            }}
          />
          {showBigHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-24 h-24 fill-white text-white animate-fade-in-out-heart" />
            </div>
          )}
        </div>

        {/* 댓글 영역 (Desktop: 50%, Mobile: 전체) */}
        <div className="flex flex-col w-full md:w-1/2 bg-white">
          {/* 게시물 헤더 */}
          <header className="flex items-center justify-between px-4 py-3 h-[60px] border-b border-instagram-border">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${user?.id || ""}`}>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-instagram-text-primary text-xs font-instagram-semibold">
                  {userInitials}
                </div>
              </Link>
              <div className="flex flex-col">
                <Link
                  href={`/profile/${user?.id || ""}`}
                  className="text-instagram-sm font-instagram-bold text-instagram-text-primary hover:opacity-70"
                >
                  {userName}
                </Link>
                <span className="text-instagram-xs text-instagram-text-secondary">
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="더보기"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-5 h-5 text-instagram-text-primary" />
              </button>
              {showMenu && post && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-instagram-border rounded-lg shadow-lg z-50 min-w-[160px] animate-[fadeIn_0.2s_ease-out_forwards]">
                  {clerkUserId && post.user?.clerk_id === clerkUserId && (
                    <button
                      className="w-full px-4 py-3 text-left text-instagram-sm text-red-500 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowMenu(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  )}
                  {clerkUserId && post.user?.clerk_id !== clerkUserId && (
                    <button
                      className="w-full px-4 py-3 text-left text-instagram-sm text-instagram-text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        alert("신고 기능은 곧 추가될 예정입니다.");
                        setShowMenu(false);
                      }}
                    >
                      신고
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* 댓글 목록 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* 캡션 */}
            {post.caption && (
              <div className="px-4 py-3 border-b border-instagram-border">
                <p className="text-instagram-sm text-instagram-text-primary">
                  <Link
                    href={`/profile/${user?.id || ""}`}
                    className="font-instagram-bold hover:opacity-70"
                  >
                    {userName}
                  </Link>{" "}
                  <span>{post.caption}</span>
                </p>
              </div>
            )}

            {/* 댓글 목록 */}
            <CommentList
              postId={currentPostId}
              maxDisplay={undefined} // 전체 표시
              showDeleteButton={true}
              currentUserId={clerkUserId || undefined}
              onCommentDelete={handleCommentDelete}
            />
          </div>

          {/* 액션 버튼 및 좋아요 수 */}
          <div className="border-t border-instagram-border">
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between px-4 py-3 h-[48px]">
              <div className="flex items-center gap-4">
                <LikeButton
                  ref={likeButtonRef}
                  postId={currentPostId}
                  initialLiked={isLiked}
                  initialLikesCount={likesCount}
                  onLikeChange={handleLikeChange}
                  size="md"
                  showCount={false}
                />
                <button
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="댓글"
                  disabled
                >
                  <MessageCircle className="w-6 h-6 text-instagram-text-primary opacity-50" />
                </button>
                <button
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="공유"
                  onClick={() => {
                    alert("공유 기능은 곧 추가될 예정입니다.");
                  }}
                >
                  <Send className="w-6 h-6 text-instagram-text-primary" />
                </button>
              </div>
              <button
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="북마크"
                onClick={() => {
                  alert("북마크 기능은 곧 추가될 예정입니다.");
                }}
              >
                <Bookmark className="w-6 h-6 text-instagram-text-primary" />
              </button>
            </div>

            {/* 좋아요 수 */}
            {likesCount > 0 && (
              <div className="px-4 pb-2">
                <p className="text-instagram-sm font-instagram-bold text-instagram-text-primary">
                  좋아요 {likesCount.toLocaleString()}개
                </p>
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <CommentForm
            postId={currentPostId}
            onSubmit={handleCommentSubmit}
            placeholder="댓글 달기..."
          />
        </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
            <DialogDescription>
              이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


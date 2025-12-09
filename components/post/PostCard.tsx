"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/time";
import type { PostWithStats, CommentWithUser } from "@/lib/types";
import LikeButton, { type LikeButtonHandle } from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import PostModal from "./PostModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Avatar 컴포넌트는 나중에 shadcn/ui로 추가 예정
// 임시로 간단한 Avatar 구현

/**
 * @file PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드를 표시합니다.
 *
 * 구성 요소:
 * 1. 헤더 (프로필 이미지, 사용자명, 시간, ⋯ 메뉴)
 * 2. 이미지 영역 (1:1 정사각형)
 * 3. 액션 버튼 (좋아요, 댓글, 공유, 북마크)
 * 4. 좋아요 수
 * 5. 캡션 (사용자명 Bold + 내용)
 * 6. 댓글 미리보기 (최신 2개)
 */

interface PostCardProps {
  post: PostWithStats;
  currentUserId?: string;
  posts?: PostWithStats[]; // 게시물 목록 (PostModal 네비게이션용)
  onPostDelete?: (postId: string) => void; // 게시물 삭제 콜백
}

export default function PostCard({ post, currentUserId, posts = [], onPostDelete }: PostCardProps) {
  const user = post.user;
  const userName = user?.name || "알 수 없음";
  const userInitials = userName.charAt(0).toUpperCase();

  // 본인 게시물 여부 확인
  const isOwnPost = currentUserId && user?.clerk_id === currentUserId;

  // PostModal 상태 관리
  const [postModalOpen, setPostModalOpen] = useState(false);

  // 삭제 관련 상태
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 캡션 처리 (2줄 초과 시 "... 더 보기")
  const [showFullCaption, setShowFullCaption] = useState(false);
  const captionLines = post.caption ? post.caption.split("\n") : [];
  const shouldTruncate = captionLines.length > 2 || (post.caption && post.caption.length > 100);

  // 더블탭 좋아요 관련 상태
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const lastTapRef = useRef(0);
  const likeButtonRef = useRef<LikeButtonHandle>(null);

  // 댓글 관련 상태
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  // 더블탭 감지 및 좋아요 처리
  const handleDoubleTap = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms 이내 더블탭으로 간주

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지 - 좋아요가 아닌 경우에만 좋아요 추가
      if (!isLiked && likeButtonRef.current) {
        likeButtonRef.current.handleLike();
        // 큰 하트 애니메이션 표시
        setShowBigHeart(true);
        setTimeout(() => {
          setShowBigHeart(false);
        }, 1000);
      }
      lastTapRef.current = 0; // 리셋
    } else {
      lastTapRef.current = now;
    }
  }, [isLiked]);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((liked: boolean, newLikesCount: number) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // 게시물 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "게시물 삭제에 실패했습니다.");
      }

      // 성공 시 피드에서 제거
      if (onPostDelete) {
        onPostDelete(post.id);
      }

      setShowDeleteDialog(false);
      setShowMenu(false);
    } catch (error: any) {
      console.error("게시물 삭제 에러:", error);
      alert(error.message || "게시물 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }, [post.id, deleting, onPostDelete]);

  return (
    <article className="bg-white border border-instagram-border border-t-0 mb-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
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
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-instagram-border rounded-lg shadow-lg z-50 min-w-[160px] animate-[fadeIn_0.2s_ease-out_forwards]">
              {isOwnPost && (
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
              {!isOwnPost && (
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

      {/* 이미지 영역 */}
      <div
        className="relative w-full aspect-square bg-gray-100 cursor-pointer"
        onDoubleClick={(e) => {
          handleDoubleTap(e);
        }}
        onTouchEnd={(e) => {
          // 모바일 더블탭 처리
          handleDoubleTap(e);
        }}
        onClick={(e) => {
          // 더블탭이 아닌 경우에만 모달 열기
          const now = Date.now();
          if (now - lastTapRef.current >= 300) {
            setPostModalOpen(true);
          }
        }}
      >
        <Image
          src={post.image_url}
          alt={post.caption || `${userName}의 게시물`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 630px"
          loading="lazy"
          draggable={false}
          onLoad={() => {
            // 이미지 로딩 완료 시 페이드 인 효과는 CSS transition으로 처리됨
          }}
          onError={(e) => {
            // 이미지 로딩 실패 시 대체 처리
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-image.png"; // 나중에 실제 placeholder 이미지로 교체
          }}
        />
        {/* 더블탭 큰 하트 애니메이션 */}
        {showBigHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="w-20 h-20 fill-instagram-like text-instagram-like animate-fade-in-out-heart" />
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          <LikeButton
            ref={likeButtonRef}
            postId={post.id}
            initialLiked={isLiked}
            initialLikesCount={likesCount}
            onLikeChange={handleLikeChange}
            size="md"
            showCount={false}
          />
          <button
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="댓글"
            onClick={() => {
              // 나중에 댓글 기능 구현
              alert("댓글 기능은 곧 추가될 예정입니다.");
            }}
          >
            <MessageCircle className="w-6 h-6 text-instagram-text-primary" />
          </button>
          <button
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="공유"
            onClick={() => {
              // 1차에서는 UI만
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
            // 1차에서는 UI만
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

      {/* 캡션 */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p className="text-instagram-sm text-instagram-text-primary">
            <Link
              href={`/profile/${user?.id || ""}`}
              className="font-instagram-bold hover:opacity-70"
            >
              {userName}
            </Link>{" "}
            {showFullCaption || !shouldTruncate ? (
              <span>{post.caption}</span>
            ) : (
              <>
                <span>{post.caption.substring(0, 100)}</span>
                {post.caption.length > 100 && (
                  <button
                    className="text-instagram-text-secondary hover:text-instagram-text-primary ml-1"
                    onClick={() => setShowFullCaption(true)}
                  >
                    ... 더 보기
                  </button>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* 댓글 목록 (최신 2개만 표시) */}
      <CommentList
        postId={post.id}
        maxDisplay={2}
        showDeleteButton={true}
        currentUserId={currentUserId}
        onCommentDelete={(commentId) => {
          // 댓글 삭제 후 댓글 수 감소
          setCommentsCount((prev) => Math.max(0, prev - 1));
        }}
      />

      {/* 댓글 작성 폼 */}
      <CommentForm
        postId={post.id}
        onSubmit={(comment) => {
          // 댓글 작성 후 댓글 수 증가
          setCommentsCount((prev) => prev + 1);
        }}
        placeholder="댓글 달기..."
      />

      {/* PostModal */}
      <PostModal
        postId={post.id}
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
        initialPost={post}
        posts={posts}
        onPostChange={(newPost) => {
          // 게시물 변경 시 PostCard 업데이트 (선택사항)
          // 필요시 여기에 로직 추가
        }}
      />

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
    </article>
  );
}


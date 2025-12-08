"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/time";
import type { PostWithStats } from "@/lib/types";
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
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const user = post.user;
  const userName = user?.name || "알 수 없음";
  const userInitials = userName.charAt(0).toUpperCase();

  // 캡션 처리 (2줄 초과 시 "... 더 보기")
  const [showFullCaption, setShowFullCaption] = React.useState(false);
  const captionLines = post.caption ? post.caption.split("\n") : [];
  const shouldTruncate = captionLines.length > 2 || (post.caption && post.caption.length > 100);

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
        <button
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="더보기"
          onClick={() => {
            // 1차에서는 UI만, 나중에 메뉴 구현
            alert("메뉴 기능은 곧 추가될 예정입니다.");
          }}
        >
          <MoreHorizontal className="w-5 h-5 text-instagram-text-primary" />
        </button>
      </header>

      {/* 이미지 영역 */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={post.image_url}
          alt={post.caption || `${userName}의 게시물`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          loading="lazy"
          onError={(e) => {
            // 이미지 로딩 실패 시 대체 처리
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-image.png"; // 나중에 실제 placeholder 이미지로 교체
          }}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          <button
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="좋아요"
            onClick={() => {
              // 나중에 좋아요 기능 구현
              alert("좋아요 기능은 곧 추가될 예정입니다.");
            }}
          >
            <Heart
              className={`w-6 h-6 ${
                post.is_liked
                  ? "fill-instagram-like text-instagram-like"
                  : "text-instagram-text-primary"
              }`}
            />
          </button>
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
      {post.likes_count > 0 && (
        <div className="px-4 pb-2">
          <p className="text-instagram-sm font-instagram-bold text-instagram-text-primary">
            좋아요 {post.likes_count.toLocaleString()}개
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

      {/* 댓글 미리보기 */}
      {post.comments_count > 0 && (
        <div className="px-4 pb-3">
          <button
            className="text-instagram-sm text-instagram-text-secondary hover:text-instagram-text-primary mb-2"
            onClick={() => {
              // 나중에 댓글 상세 모달 구현
              alert("댓글 상세 기능은 곧 추가될 예정입니다.");
            }}
          >
            댓글 {post.comments_count}개 모두 보기
          </button>
          {/* 나중에 실제 댓글 데이터를 표시 */}
          {/* <div className="space-y-1">
            {comments.slice(0, 2).map((comment) => (
              <p key={comment.id} className="text-instagram-sm text-instagram-text-primary">
                <span className="font-instagram-bold">{comment.user.name}</span> {comment.content}
              </p>
            ))}
          </div> */}
        </div>
      )}
    </article>
  );
}


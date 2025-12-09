import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostGrid from "@/components/profile/PostGrid";
import PostGridSkeleton from "@/components/profile/PostGridSkeleton";
import type { UserWithStats, PostWithStats } from "@/lib/types";

/**
 * @file app/(main)/profile/[userId]/page.tsx
 * @description 프로필 페이지
 *
 * 동적 라우트:
 * - `/profile/[userId]`: 특정 사용자의 프로필
 * - 본인 프로필 여부 확인
 * - 사용자 정보 및 게시물 표시
 */

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function ProfileContent({ userId }: { userId: string }) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-instagram-sm text-instagram-text-secondary">
          로그인이 필요합니다.
        </p>
      </div>
    );
  }

  const supabase = createClerkSupabaseClient();

  // 현재 사용자의 Supabase user_id 조회
  const { data: currentUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  // userId가 Clerk ID인지 Supabase user_id인지 확인
  let targetUserId: string;

  const { data: userByClerkId } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (userByClerkId) {
    targetUserId = userByClerkId.id;
  } else {
    targetUserId = userId;
  }

  // 사용자 정보 조회 (직접 Supabase 사용)
  // userId가 Clerk ID인지 Supabase user_id인지 확인
  let targetUserIdForQuery: string = targetUserId;

  // user_stats 뷰에서 사용자 정보 및 통계 조회
  const { data: userStats, error: userStatsError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", targetUserIdForQuery)
    .single();

  if (userStatsError || !userStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-instagram-sm text-red-500">
          사용자를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  // 현재 사용자가 해당 사용자를 팔로우하는지 확인 (본인이 아닌 경우)
  let isFollowing = false;
  if (currentUser && targetUserIdForQuery !== currentUser.id) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetUserIdForQuery)
      .single();

    isFollowing = !!follow;
  }

  // UserWithStats 타입으로 변환
  const user: UserWithStats = {
    id: userStats.user_id,
    clerk_id: userStats.clerk_id,
    name: userStats.name,
    created_at: "", // user_stats 뷰에 created_at이 없으므로 별도 조회
    posts_count: userStats.posts_count || 0,
    followers_count: userStats.followers_count || 0,
    following_count: userStats.following_count || 0,
    is_following: isFollowing,
  };

  // created_at 조회
  const { data: userInfo } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", targetUserIdForQuery)
    .single();

  if (userInfo) {
    user.created_at = userInfo.created_at;
  }

  // 본인 프로필 여부 확인
  const isOwnProfile = currentUser?.id === targetUserId;

  // 게시물 목록 조회 (직접 Supabase 사용, 기존 API와 동일한 방식)
  let query = supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      image_url,
      caption,
      created_at,
      updated_at,
      users!posts_user_id_fkey (
        id,
        clerk_id,
        name,
        created_at
      )
    `
    )
    .eq("user_id", targetUserIdForQuery)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: postsData, error: postsError } = await query;

  let initialPosts: PostWithStats[] = [];
  if (postsData && !postsError && currentUser) {
    // 각 게시물에 통계 정보 추가
    initialPosts = await Promise.all(
      postsData.map(async (post: any) => {
        // 좋아요 수 조회
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        // 댓글 수 조회
        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        // 현재 사용자의 좋아요 상태 확인
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id)
          .single();

        return {
          id: post.id,
          user_id: post.user_id,
          image_url: post.image_url,
          caption: post.caption,
          created_at: post.created_at,
          updated_at: post.updated_at,
          user: post.users,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: !!like,
        };
      })
    );
  }

  return (
    <div className="w-full max-w-[935px] mx-auto px-4 md:px-0">
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        currentUserId={clerkUserId}
      />
      <Suspense fallback={<PostGridSkeleton />}>
        <PostGrid userId={targetUserId} initialPosts={initialPosts} />
      </Suspense>
    </div>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-8">로딩 중...</div>}>
        <ProfileContent userId={userId} />
      </Suspense>
    </div>
  );
}


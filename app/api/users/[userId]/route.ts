import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { UserWithStats } from "@/lib/types";

/**
 * @file app/api/users/[userId]/route.ts
 * @description 사용자 정보 API Route
 *
 * GET: 사용자 정보 조회
 * - user_stats 뷰 활용
 * - 현재 사용자의 팔로우 상태 확인
 * - 본인 프로필 여부 확인
 * - userId는 Supabase user_id 또는 Clerk ID 모두 지원
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: "현재 사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // userId가 Clerk ID인지 Supabase user_id인지 확인
    let targetUserId: string;

    // 먼저 Clerk ID로 조회 시도
    const { data: userByClerkId } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userByClerkId) {
      targetUserId = userByClerkId.id;
    } else {
      // Supabase user_id로 간주
      targetUserId = userId;
    }

    // user_stats 뷰에서 사용자 정보 및 통계 조회
    const { data: userStats, error: userStatsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (userStatsError || !userStats) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 현재 사용자가 해당 사용자를 팔로우하는지 확인 (본인이 아닌 경우)
    let isFollowing = false;
    if (targetUserId !== currentUser.id) {
      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", targetUserId)
        .single();

      isFollowing = !!follow;
    }

    // UserWithStats 타입으로 변환
    const userWithStats: UserWithStats = {
      id: userStats.user_id,
      clerk_id: userStats.clerk_id,
      name: userStats.name,
      created_at: "", // user_stats 뷰에 created_at이 없으므로 별도 조회 필요 (선택사항)
      posts_count: userStats.posts_count || 0,
      followers_count: userStats.followers_count || 0,
      following_count: userStats.following_count || 0,
      is_following: isFollowing,
    };

    // created_at 조회 (선택사항)
    const { data: userInfo } = await supabase
      .from("users")
      .select("created_at")
      .eq("id", targetUserId)
      .single();

    if (userInfo) {
      userWithStats.created_at = userInfo.created_at;
    }

    return NextResponse.json({
      data: userWithStats,
    });
  } catch (error: any) {
    console.error("사용자 정보 API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


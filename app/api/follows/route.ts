import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { ApiResponse } from "@/lib/types";

/**
 * @file app/api/follows/route.ts
 * @description 팔로우 API Route
 *
 * POST: 팔로우 추가
 * DELETE: 팔로우 제거
 * - 인증 검증 (Clerk)
 * - 자기 자신 팔로우 방지
 * - 중복 팔로우 방지
 * - 팔로워 수 반환
 */

/**
 * POST: 팔로우 추가
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("사용자 조회 에러:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 자기 자신 팔로우 방지
    if (currentUser.id === followingId) {
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // 팔로우 추가
    const { error: insertError } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUser.id,
        following_id: followingId,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint violation (이미 팔로우 중)
        return NextResponse.json(
          { error: "이미 팔로우 중입니다." },
          { status: 409 }
        );
      }
      console.error("팔로우 추가 에러:", insertError);
      return NextResponse.json(
        { error: "팔로우 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    // 업데이트된 팔로워 수 조회
    const { count, error: countError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", followingId);

    if (countError) {
      console.error("팔로워 수 조회 에러:", countError);
      // 팔로우 추가는 성공했으므로 200 반환, 카운트만 누락
      return NextResponse.json(
        {
          message: "팔로우가 추가되었습니다.",
          data: { followersCount: null },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "팔로우가 추가되었습니다.",
        data: { followersCount: count },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("팔로우 POST API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 팔로우 제거 (언팔로우)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("사용자 조회 에러:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 팔로우 제거
    const { error: deleteError, count } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", followingId)
      .select("*", { count: "exact" });

    if (deleteError) {
      console.error("팔로우 제거 에러:", deleteError);
      return NextResponse.json(
        { error: "팔로우 제거에 실패했습니다." },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: "팔로우 관계를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트된 팔로워 수 조회
    const { count: followersCount, error: countError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", followingId);

    if (countError) {
      console.error("팔로워 수 조회 에러:", countError);
      // 팔로우 제거는 성공했으므로 200 반환, 카운트만 누락
      return NextResponse.json(
        {
          message: "팔로우가 제거되었습니다.",
          data: { followersCount: null },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "팔로우가 제거되었습니다.",
        data: { followersCount },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("팔로우 DELETE API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


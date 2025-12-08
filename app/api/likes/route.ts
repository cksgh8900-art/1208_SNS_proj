import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

/**
 * @file app/api/likes/route.ts
 * @description 좋아요 API Route
 *
 * POST: 좋아요 추가
 * DELETE: 좋아요 제거
 *
 * 인증 검증 (Clerk) 필수
 */

/**
 * POST: 좋아요 추가
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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 중복 좋아요 확인
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUser.id)
      .single();

    if (existingLike) {
      // 이미 좋아요한 경우, 좋아요 수만 반환
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      return NextResponse.json({
        data: {
          likesCount: likesCount || 0,
        },
      });
    }

    // 좋아요 추가
    const { data: like, error: likeError } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
      })
      .select()
      .single();

    if (likeError) {
      console.error("좋아요 추가 에러:", likeError);
      return NextResponse.json(
        { error: "좋아요 추가 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 좋아요 수 조회
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return NextResponse.json({
      data: {
        like,
        likesCount: likesCount || 0,
      },
    });
  } catch (error: any) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 좋아요 제거
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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 좋아요 제거
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", currentUser.id);

    if (deleteError) {
      console.error("좋아요 제거 에러:", deleteError);
      return NextResponse.json(
        { error: "좋아요 제거 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 좋아요 수 조회
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return NextResponse.json({
      data: {
        likesCount: likesCount || 0,
      },
    });
  } catch (error: any) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


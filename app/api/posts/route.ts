import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { PostWithStats } from "@/lib/types";

/**
 * @file app/api/posts/route.ts
 * @description 게시물 API Route
 *
 * GET: 게시물 목록 조회
 * - 시간 역순 정렬
 * - 페이지네이션 지원 (limit, offset)
 * - userId 파라미터 지원 (프로필 페이지용)
 * - 통계 정보 포함 (좋아요 수, 댓글 수)
 * - 사용자 정보 JOIN
 * - 현재 사용자의 좋아요 상태 확인
 */

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId") || null;

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

    // 게시물 조회 쿼리 빌드
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
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // userId가 있으면 특정 사용자의 게시물만 조회
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error("게시물 조회 에러:", postsError);
      return NextResponse.json(
        { error: "게시물을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        data: [],
        hasMore: false,
      });
    }

    // 각 게시물에 통계 정보 추가
    const postsWithStats: PostWithStats[] = await Promise.all(
      posts.map(async (post: any) => {
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
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          user: post.users
            ? {
                id: post.users.id,
                clerk_id: post.users.clerk_id,
                name: post.users.name,
                created_at: post.users.created_at,
              }
            : undefined,
          is_liked: !!like,
        };
      })
    );

    // 다음 페이지 존재 여부 확인
    const { count: totalCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .then((query) => {
        if (userId) {
          return query.eq("user_id", userId);
        }
        return query;
      });

    const hasMore = totalCount ? offset + limit < totalCount : false;

    return NextResponse.json({
      data: postsWithStats,
      hasMore,
    });
  } catch (error: any) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


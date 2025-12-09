import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { CommentWithUser, ApiResponse } from "@/lib/types";

/**
 * @file app/api/comments/route.ts
 * @description 댓글 API Route
 *
 * GET: 댓글 목록 조회
 * - 특정 게시물의 댓글 목록 조회
 * - 시간 역순 정렬 (최신순)
 * - 사용자 정보 JOIN
 * - 페이지네이션 지원
 *
 * POST: 댓글 작성
 * - 댓글 작성
 * - 인증 검증 (Clerk)
 * - 게시물 존재 확인
 * - 댓글 내용 검증
 *
 * DELETE: 댓글 삭제
 * - 본인만 삭제 가능
 * - 인증 검증 (Clerk)
 * - 소유자 확인
 */

/**
 * GET: 댓글 목록 조회
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
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!postId) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 조회
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!comments_user_id_fkey (
          id,
          clerk_id,
          name,
          created_at
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error("댓글 조회 에러:", commentsError);
      return NextResponse.json(
        { error: "댓글을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // CommentWithUser 타입으로 변환
    const commentsWithUser: CommentWithUser[] = (comments || []).map(
      (comment: any) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: comment.users
          ? {
              id: comment.users.id,
              clerk_id: comment.users.clerk_id,
              name: comment.users.name,
              created_at: comment.users.created_at,
            }
          : undefined,
      })
    );

    // 다음 페이지 존재 여부 확인
    const { count: totalCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    const hasMore = totalCount ? offset + limit < totalCount : false;

    return NextResponse.json({
      data: commentsWithUser,
      hasMore,
    });
  } catch (error: any) {
    console.error("댓글 GET API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST: 댓글 작성
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
    const { postId, content } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "댓글 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // 댓글 내용 검증 (빈 문자열, 공백만 있는 경우 방지)
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: "댓글을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

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

    // 댓글 저장
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: trimmedContent,
      })
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!comments_user_id_fkey (
          id,
          clerk_id,
          name,
          created_at
        )
      `
      )
      .single();

    if (commentError) {
      console.error("댓글 작성 에러:", commentError);
      return NextResponse.json(
        { error: "댓글 작성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // CommentWithUser 타입으로 변환
    const commentWithUser: CommentWithUser = {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: comment.users
        ? {
            id: comment.users.id,
            clerk_id: comment.users.clerk_id,
            name: comment.users.name,
            created_at: comment.users.created_at,
          }
        : undefined,
    };

    return NextResponse.json({
      data: commentWithUser,
    });
  } catch (error: any) {
    console.error("댓글 POST API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 댓글 삭제
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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "댓글 ID가 필요합니다." },
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
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 존재 확인 및 소유자 확인
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 소유자 확인
    if (comment.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: "댓글을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("댓글 삭제 에러:", deleteError);
      return NextResponse.json(
        { error: "댓글 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "댓글이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("댓글 DELETE API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


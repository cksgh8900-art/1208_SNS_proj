import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";
import type { PostWithStats, Post } from "@/lib/types";
import { APIError, logError, toAPIError } from "@/lib/utils/error";

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
 *
 * POST: 게시물 생성
 * - 이미지 파일 검증 (최대 5MB)
 * - Supabase Storage 업로드
 * - posts 테이블에 데이터 저장
 * - 인증 검증 (Clerk)
 */

/**
 * 에러 응답 생성 헬퍼 함수
 */
function createErrorResponse(
  message: string,
  statusCode: number,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === "development" && details && { details }),
    },
    { status: statusCode }
  );
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return createErrorResponse("인증이 필요합니다.", 401);
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
      logError(userError, "사용자 조회");
      return createErrorResponse("사용자 정보를 찾을 수 없습니다.", 404);
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
      logError(postsError, "게시물 조회");
      return createErrorResponse(
        "게시물을 불러오는 중 오류가 발생했습니다.",
        500,
        postsError
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

/**
 * POST: 게시물 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return createErrorResponse("인증이 필요합니다.", 401);
    }

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const caption = formData.get("caption") as string | null;

    // 이미지 파일 검증
    if (!imageFile) {
      return createErrorResponse("이미지 파일이 필요합니다.", 400);
    }

    // 파일 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return createErrorResponse("이미지 크기는 5MB를 초과할 수 없습니다.", 413);
    }

    // 파일 형식 검증
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(imageFile.type)) {
      return createErrorResponse(
        "지원되는 이미지 형식만 업로드할 수 있습니다. (JPEG, PNG, WebP, GIF)",
        400
      );
    }

    // 캡션 검증 (최대 2,200자)
    const MAX_CAPTION_LENGTH = 2200;
    if (caption && caption.length > MAX_CAPTION_LENGTH) {
      return createErrorResponse(
        `캡션은 최대 ${MAX_CAPTION_LENGTH}자까지 입력할 수 있습니다.`,
        400
      );
    }

    // Supabase 클라이언트 생성 (Storage 업로드용)
    const supabase = getServiceRoleClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      logError(userError, "사용자 조회");
      return createErrorResponse("사용자 정보를 찾을 수 없습니다.", 404);
    }

    // 파일명 생성
    const timestamp = Date.now();
    const fileExtension = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}_${imageFile.name}`;
    const filePath = `${clerkUserId}/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(filePath, buffer, {
        contentType: imageFile.type,
        upsert: false, // 중복 방지
      });

    if (uploadError) {
      logError(uploadError, "Storage 업로드");
      return createErrorResponse(
        "이미지 업로드 중 오류가 발생했습니다.",
        500,
        uploadError
      );
    }

    // 공개 URL 획득
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(filePath);

    // posts 테이블에 데이터 저장
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: currentUser.id,
        image_url: publicUrl,
        caption: caption || null,
      })
      .select()
      .single();

    if (postError) {
      logError(postError, "게시물 생성");
      // 업로드된 파일 삭제 시도 (롤백)
      try {
        await supabase.storage.from("posts").remove([filePath]);
      } catch (cleanupError) {
        logError(cleanupError, "Storage 파일 삭제 (롤백)");
      }
      return createErrorResponse(
        "게시물 생성 중 오류가 발생했습니다.",
        500,
        postError
      );
    }

    return NextResponse.json({
      data: {
        post: post as Post,
        imageUrl: publicUrl,
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


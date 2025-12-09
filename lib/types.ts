/**
 * @file types.ts
 * @description Instagram Clone SNS 프로젝트의 TypeScript 타입 정의
 *
 * Supabase 데이터베이스 스키마를 기반으로 작성되었습니다.
 * @see supabase/migrations/DB.sql
 */

/**
 * 사용자 타입
 * Clerk 인증과 연동되는 사용자 정보
 */
export interface User {
  id: string; // UUID
  clerk_id: string; // Clerk User ID (Unique)
  name: string;
  created_at: string; // ISO timestamp
}

/**
 * 게시물 타입
 */
export interface Post {
  id: string; // UUID
  user_id: string; // UUID (User.id 참조)
  image_url: string; // Supabase Storage URL
  caption: string | null; // 최대 2,200자 (애플리케이션에서 검증)
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * 좋아요 타입
 */
export interface Like {
  id: string; // UUID
  post_id: string; // UUID (Post.id 참조)
  user_id: string; // UUID (User.id 참조)
  created_at: string; // ISO timestamp
}

/**
 * 댓글 타입
 */
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID (Post.id 참조)
  user_id: string; // UUID (User.id 참조)
  content: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * 팔로우 타입
 */
export interface Follow {
  id: string; // UUID
  follower_id: string; // UUID (팔로우하는 사람, User.id 참조)
  following_id: string; // UUID (팔로우받는 사람, User.id 참조)
  created_at: string; // ISO timestamp
}

/**
 * 통계가 포함된 게시물 타입
 * post_stats 뷰를 활용한 확장 타입
 */
export interface PostWithStats extends Post {
  likes_count: number;
  comments_count: number;
  user?: User; // JOIN된 사용자 정보
  is_liked?: boolean; // 현재 사용자가 좋아요 했는지
}

/**
 * 통계가 포함된 사용자 타입
 * user_stats 뷰를 활용한 확장 타입
 */
export interface UserWithStats extends User {
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following?: boolean; // 현재 사용자가 팔로우 했는지
}

/**
 * 사용자 정보가 포함된 댓글 타입
 */
export interface CommentWithUser extends Comment {
  user?: User; // JOIN된 사용자 정보
}

/**
 * API 응답 타입
 * API Route에서 사용할 표준 응답 형식
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}


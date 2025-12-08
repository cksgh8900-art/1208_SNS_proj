-- ============================================
-- 마이그레이션 검증 SQL 쿼리
-- ============================================
-- 이 파일은 마이그레이션이 성공적으로 적용되었는지 확인하는 쿼리입니다.
-- Supabase Dashboard > SQL Editor에서 실행하여 결과를 확인하세요.
-- ============================================

-- ============================================
-- 1. 테이블 확인
-- ============================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 예상 결과:
-- comments
-- follows
-- likes
-- posts
-- users

-- ============================================
-- 2. 뷰 확인
-- ============================================
SELECT 
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 예상 결과:
-- post_stats
-- user_stats

-- ============================================
-- 3. 트리거 확인
-- ============================================
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 예상 결과:
-- set_updated_at | comments | BEFORE | UPDATE
-- set_updated_at | posts    | BEFORE | UPDATE

-- ============================================
-- 4. 함수 확인
-- ============================================
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 예상 결과:
-- handle_updated_at

-- ============================================
-- 5. 인덱스 확인
-- ============================================
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 예상 결과 (주요 인덱스):
-- comments | idx_comments_created_at
-- comments | idx_comments_post_id
-- comments | idx_comments_user_id
-- follows  | idx_follows_follower_id
-- follows  | idx_follows_following_id
-- likes    | idx_likes_post_id
-- likes    | idx_likes_user_id
-- posts    | idx_posts_created_at
-- posts    | idx_posts_user_id

-- ============================================
-- 6. 외래 키 제약 조건 확인
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 예상 결과:
-- comments | post_id  | posts  | id
-- comments | user_id  | users  | id
-- follows  | follower_id | users | id
-- follows  | following_id | users | id
-- likes    | post_id  | posts  | id
-- likes    | user_id  | users  | id
-- posts    | user_id  | users  | id

-- ============================================
-- 7. 테이블별 컬럼 확인 (선택사항)
-- ============================================
-- 특정 테이블의 구조를 확인하려면 다음 쿼리를 사용하세요:
-- SELECT 
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--     AND table_name = 'users'  -- 테이블명 변경
-- ORDER BY ordinal_position;


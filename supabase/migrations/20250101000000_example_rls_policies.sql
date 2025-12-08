-- 예시: RLS 정책이 적용된 tasks 테이블
-- 이 파일은 참고용이며, 실제 프로젝트에 맞게 수정하여 사용하세요.

-- 테이블 생성
-- user_id 컬럼은 Clerk user ID를 저장하며, 기본값으로 auth.jwt()->>'sub' 사용
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
-- 개발 중에는 비활성화할 수 있으나, 프로덕션에서는 반드시 활성화
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING ((auth.jwt()->>'sub') = user_id);

-- 정책 2: 사용자는 자신의 tasks만 생성 가능
-- WITH CHECK로 user_id가 현재 사용자의 ID와 일치하는지 확인
CREATE POLICY "Users can insert their own tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- 정책 3: 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- 정책 4: 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING ((auth.jwt()->>'sub') = user_id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 권한 부여
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.tasks TO service_role;


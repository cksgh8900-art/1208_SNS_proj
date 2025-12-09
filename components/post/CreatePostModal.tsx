"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";

/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * 기능:
 * - 이미지 파일 선택 및 미리보기
 * - 캡션 입력 (최대 2,200자)
 * - Supabase Storage 업로드
 * - 게시물 생성
 */

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MAX_CAPTION_LENGTH = 2200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function CreatePostModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostModalProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setError(null);
      setUploading(false);
    }
  }, [open]);

  // object URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 파일 검증
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: "이미지 크기는 5MB를 초과할 수 없습니다.",
      };
    }

    // 파일 형식 확인
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "지원되는 이미지 형식만 업로드할 수 있습니다. (JPEG, PNG, WebP, GIF)",
      };
    }

    return { valid: true };
  }, []);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 검증
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "파일 선택 중 오류가 발생했습니다.");
        return;
      }

      // 기존 preview URL 정리
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setError(null);
    },
    [previewUrl, validateFile]
  );

  // 파일 제거 핸들러
  const handleFileRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // 캡션 변경 핸들러
  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CAPTION_LENGTH) {
        setCaption(value);
        setError(null);
      }
    },
    []
  );

  // 업로드 핸들러
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "게시물 업로드 중 오류가 발생했습니다.");
      }

      // 성공 시 모달 닫기 및 콜백 호출
      onOpenChange(false);
      
      // 피드 새로고침 (router.refresh로 서버 컴포넌트 재렌더링)
      router.refresh();
      
      if (onSuccess) {
        onSuccess();
      }
      } catch (err: any) {
        logError(err, "게시물 업로드");
        const errorMessage = getUserFriendlyErrorMessage(err);
        setError(errorMessage);
      } finally {
      setUploading(false);
    }
  }, [selectedFile, caption, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>게시물 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 이미지 미리보기 영역 */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-instagram-border">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="미리보기"
                  fill
                  className="object-contain"
                  sizes="600px"
                />
                <button
                  onClick={handleFileRemove}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-instagram-text-secondary">
                <p className="text-instagram-sm mb-4">이미지를 선택하세요</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  사진 선택
                </Button>
              </div>
            )}
          </div>

          {/* 파일 선택 input (숨김) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 파일 선택 버튼 (이미지가 선택되지 않은 경우) */}
          {!selectedFile && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              사진 선택
            </Button>
          )}

          {/* 캡션 입력 필드 */}
          <div className="space-y-2">
            <Textarea
              placeholder="캡션을 입력하세요..."
              value={caption}
              onChange={handleCaptionChange}
              rows={4}
              maxLength={MAX_CAPTION_LENGTH}
              className="resize-none"
            />
            <div className="flex justify-end">
              <span className="text-instagram-xs text-instagram-text-secondary">
                {caption.length} / {MAX_CAPTION_LENGTH}
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-instagram-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 업로드 버튼 */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-instagram-blue text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              "공유하기"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


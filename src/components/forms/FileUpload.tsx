'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface UploadedFile {
  projection_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface FileUploadProps {
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export default function FileUpload({ onUploadSuccess, onUploadError, className }: FileUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 支持的文件类型和大小限制
  const supportedTypes = ['.litematic', '.schem', '.schematic', '.nbt'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  // 验证文件
  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!supportedTypes.includes(extension)) {
      return `不支持的文件类型。支持的格式：${supportedTypes.join(', ')}`;
    }

    if (file.size > maxFileSize) {
      return `文件大小超过限制。最大支持 ${formatFileSize(maxFileSize)}`;
    }

    if (file.size === 0) {
      return '文件为空，请选择有效的文件';
    }

    return null;
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    setError('');
    setSuccess('');
    setUploading(true);
    setUploadProgress(0);

    try {
      // 验证文件
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      logger.info('Starting file upload', {
        filename: file.name,
        size: file.size,
        type: file.type,
        userId: user?.id
      });

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      // 将文件转换为 base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // 移除 data:xxx;base64, 前缀
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/.netlify/functions/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          fileData,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '上传失败');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess('文件上传成功！');

      logger.info('File upload successful', {
        projectionId: data.data.projection_id,
        filename: file.name,
        userId: user?.id
      });

      // 调用成功回调
      if (onUploadSuccess) {
        onUploadSuccess(data.data);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
      setError(errorMessage);

      logger.error('File upload failed', {
        filename: file.name,
        error: errorMessage,
        userId: user?.id
      });

      // 调用错误回调
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setError('');
        setSuccess('');
      }, 3000);
    }
  };

  // 处理文件拖拽
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadFile]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  // 点击上传区域
  const handleClick = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${dragActive
          ? 'border-primary bg-primary/5 scale-105'
          : 'border-border hover:border-primary/50 hover:bg-primary/2'
          } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-foreground">
              {uploading ? '正在上传...' : dragActive ? '释放文件开始上传' : '拖拽文件到此处'}
            </p>
            <p className="text-sm text-muted-foreground">
              或 <span className="text-primary">点击选择文件</span>
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>支持格式：{supportedTypes.join(', ')}</p>
            <p>最大文件大小：{formatFileSize(maxFileSize)}</p>
          </div>
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="mt-6">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              上传进度：{Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-slide-up">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 animate-slide-up">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
}

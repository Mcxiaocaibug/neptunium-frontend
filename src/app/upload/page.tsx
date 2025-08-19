'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/forms/FileUpload';
import UploadResult from '@/components/forms/UploadResult';

interface UploadedFile {
  projection_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  // 处理上传成功
  const handleUploadSuccess = (file: UploadedFile) => {
    setUploadedFile(file);
  };

  // 处理上传错误
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  // 重新上传
  const handleNewUpload = () => {
    setUploadedFile(null);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            上传投影文件
          </h1>
          <p className="text-lg text-muted-foreground">
            支持 Litematica、WorldEdit、MCEdit 等格式的投影文件
          </p>
        </div>

        {!user && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 text-sm">
              💡 提示：您当前是匿名上传。
              <button
                onClick={() => router.push('/register')}
                className="ml-1 text-primary hover:text-primary/80 underline"
              >
                注册账户
              </button>
              后可以管理您的文件历史。
            </p>
          </div>
        )}

        {uploadedFile ? (
          <UploadResult
            file={uploadedFile}
            onNewUpload={handleNewUpload}
          />
        ) : (
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )}

        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user ? (
              <Button
                variant="outline"
                onClick={() => router.push('/files')}
                className="w-full"
              >
                查看我的文件
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push('/register')}
                className="w-full"
              >
                注册账户
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

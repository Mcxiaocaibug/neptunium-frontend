'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatFileSize, getFileTypeDescription } from '@/lib/utils';

interface UploadedFile {
  projection_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface UploadResultProps {
  file: UploadedFile;
  onNewUpload?: () => void;
  className?: string;
}

export default function UploadResult({ file, onNewUpload, className }: UploadResultProps) {
  const [copied, setCopied] = useState(false);

  // 复制投影ID
  const copyProjectionId = async () => {
    try {
      await navigator.clipboard.writeText(file.projection_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = file.projection_id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={`animate-slide-up ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-green-400 mb-2">
              🎉 上传成功！
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">文件名</p>
                  <p className="text-foreground font-medium truncate" title={file.filename}>
                    {file.filename}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">文件大小</p>
                  <p className="text-foreground">{formatFileSize(file.file_size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">文件类型</p>
                  <p className="text-foreground">{getFileTypeDescription(file.filename)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">上传时间</p>
                  <p className="text-foreground">
                    {new Date(file.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {/* 投影ID显示 */}
              <div className="p-4 bg-secondary/50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">投影ID</p>
                  <span className="text-xs text-muted-foreground">
                    请将此ID分享给基岩版玩家
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-1 p-3 bg-background rounded border font-mono text-center">
                    <span className="text-2xl font-bold text-primary tracking-wider">
                      {file.projection_id}
                    </span>
                  </div>
                  
                  <Button
                    onClick={copyProjectionId}
                    variant={copied ? "secondary" : "primary"}
                    size="sm"
                    className="px-4"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        已复制
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        复制
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 使用说明 */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  使用说明
                </h4>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li>• 基岩版玩家在游戏中输入投影ID：<code className="bg-blue-500/20 px-1 rounded">{file.projection_id}</code></li>
                  <li>• 插件会自动下载并加载投影文件</li>
                  <li>• 玩家可以在FormUI中调整投影位置和设置</li>
                  <li>• 投影ID永久有效，可以重复使用</li>
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onNewUpload && (
                  <Button
                    onClick={onNewUpload}
                    variant="outline"
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    上传新文件
                  </Button>
                )}
                
                <Button
                  onClick={() => window.open(`/.netlify/functions/projection?id=${file.projection_id}`, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  测试API
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

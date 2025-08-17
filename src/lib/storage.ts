import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config';

// Cloudflare R2 客户端配置
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

// 存储操作辅助函数
export const storage = {
  // 上传文件
  async uploadFile(
    key: string,
    file: Buffer | Uint8Array,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await r2Client.send(command);
    
    // 返回公共访问URL
    return `${config.r2.publicUrl}/${key}`;
  },

  // 获取文件
  async getFile(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
      });

      const response = await r2Client.send(command);
      
      if (!response.Body) return null;

      // 将流转换为Buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error getting file from R2:', error);
      return null;
    }
  },

  // 获取预签名下载URL
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
  },

  // 删除文件
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    });

    await r2Client.send(command);
  },

  // 生成文件存储路径
  generateFilePath(projectionId: string, filename: string): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    return `projections/${projectionId}/${timestamp}.${extension}`;
  },

  // 验证文件类型
  isValidFileType(filename: string): boolean {
    const extension = '.' + filename.split('.').pop()?.toLowerCase();
    return config.business.allowedFileTypes.includes(extension);
  },

  // 验证文件大小
  isValidFileSize(size: number): boolean {
    return size <= config.business.maxFileSize;
  },
};

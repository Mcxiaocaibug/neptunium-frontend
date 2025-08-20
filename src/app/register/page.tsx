'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/lib/utils';

function RegisterPageContent() {
  const router = useRouter();
  const { register, sendVerificationCode } = useAuth();
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 发送验证码
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !isValidEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);

    try {
      await sendVerificationCode(email);
      setSuccess('验证码已发送到您的邮箱，请查收');
      setStep('verify');

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证邮箱并完成注册
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);

    try {
      await register(email, code);
      setSuccess('注册成功！正在跳转...');

      // 跳转到首页
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">N</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Neptunium</span>
          </Link>
          <h2 className="text-3xl font-bold text-foreground">
            创建您的账户
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            已有账户？{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              立即登录
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'email' ? '邮箱注册' : '验证邮箱'}
            </CardTitle>
            <CardDescription>
              {step === 'email'
                ? '输入您的邮箱地址开始注册'
                : `验证码已发送到 ${email}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleSendCode} className="space-y-6">
                <Input
                  label="邮箱地址"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入您的邮箱地址"
                  error={error}
                  disabled={loading}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                {success && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? '发送中...' : '发送验证码'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <Input
                  label="验证码"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="请输入6位验证码"
                  error={error}
                  disabled={loading}
                  helperText="请查看您的邮箱，验证码有效期为10分钟"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                {success && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? '验证中...' : '验证并注册'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => countdown === 0 ? handleSendCode({ preventDefault: () => { } } as React.FormEvent) : undefined}
                    disabled={countdown > 0 || loading}
                    className="px-4"
                  >
                    {countdown > 0 ? `${countdown}s` : '重发'}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('email')}
                  className="w-full"
                  disabled={loading}
                >
                  返回修改邮箱
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            注册即表示您同意我们的{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              服务条款
            </Link>{' '}
            和{' '}
            <Link href="/privacy" className="text-primary hover:text-primary/80">
              隐私政策
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            <a
              href="https://www.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              This site is powered by Netlify
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <RegisterPageContent />
    </ProtectedRoute>
  );
}

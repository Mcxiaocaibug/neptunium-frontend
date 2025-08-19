'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email: string;
  api_key?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  register: (email: string, code: string) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const initAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          logger.info('User restored from localStorage', { userId: parsedUser.id });
        }
      } catch (error) {
        logger.error('Failed to restore user from localStorage', undefined, error as Error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 发送验证码
  const sendVerificationCode = async (email: string): Promise<void> => {
    try {
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '发送验证码失败');
      }

      logger.info('Verification code sent', { email });
    } catch (error) {
      logger.error('Failed to send verification code', { email }, error as Error);
      throw error;
    }
  };

  // 注册
  const register = async (email: string, code: string): Promise<void> => {
    try {
      const response = await fetch('/.netlify/functions/auth-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      const userData = data.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      logger.info('User registered successfully', { userId: userData.id, email });
    } catch (error) {
      logger.error('Registration failed', { email }, error as Error);
      throw error;
    }
  };

  // 登录
  const login = async (email: string): Promise<void> => {
    try {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      const userData = data.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      logger.info('User logged in successfully', { userId: userData.id, email });
    } catch (error) {
      logger.error('Login failed', { email }, error as Error);
      throw error;
    }
  };

  // 登出
  const logout = () => {
    try {
      const userId = user?.id;
      setUser(null);
      localStorage.removeItem('user');
      
      logger.info('User logged out', { userId });
      
      // 跳转到首页
      router.push('/');
    } catch (error) {
      logger.error('Logout failed', undefined, error as Error);
    }
  };

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    logger.info('User data updated', { userId: user.id, updatedFields: Object.keys(userData) });
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    sendVerificationCode,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 路由保护组件
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        logger.info('Redirecting unauthenticated user', { redirectTo });
        router.push(redirectTo);
      } else if (!requireAuth && user) {
        logger.info('Redirecting authenticated user', { redirectTo: '/' });
        router.push('/');
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // 重定向中
  }

  if (!requireAuth && user) {
    return null; // 重定向中
  }

  return <>{children}</>;
};

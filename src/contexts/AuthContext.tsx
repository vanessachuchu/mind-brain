import React, { createContext, useContext, useEffect, useState } from 'react';

interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

interface AuthContextType {
  user: MockUser | null;
  session: Record<string, unknown> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 創建一個模擬的已登入用戶
  const mockUser: MockUser = {
    id: 'guest-user',
    email: 'guest@thoughtspark.app',
    user_metadata: {
      display_name: '訪客用戶'
    }
  };

  const [user] = useState<MockUser | null>(mockUser);
  const [session] = useState<Record<string, unknown> | null>({ user: mockUser });
  const [loading] = useState(false);

  // 模擬的身份驗證函數（始終成功）
  const signIn = async (email: string, password: string) => {
    return { error: null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    return { error: null };
  };

  const signOut = async () => {
    return { error: null };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
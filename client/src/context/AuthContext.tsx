import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type UserResponse,
  type Role,
  loginUserApi,
  registerUserApi,
  logoutUserApi,
  getCurrentUserApi,
} from '../services/api';

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserResponse>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }) => Promise<UserResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    getCurrentUserApi()
      .then((res) => {
        if (mounted) {
          setUser(res.user);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<UserResponse> => {
    const res = await loginUserApi({ email, password });
    setUser(res.user);
    return res.user;
  };

  const register = async (input: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<UserResponse> => {
    const res = await registerUserApi(input);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    await logoutUserApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

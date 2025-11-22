// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService, type User, type AuthResponse } from "~/lib/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: () => Promise<AuthResponse>;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have a token in localStorage
        const token = authService.getToken();
        if (token) {
          // Verify the token is still valid by checking auth status
          const statusResponse = await authService.checkAuthStatus();

          if (statusResponse.authenticated && statusResponse.user) {
            setUser(statusResponse.user);
          } else {
            // Token is invalid, clear it
            await authService.logout();
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Failed to initialize authentication");
        // Clear any invalid auth data
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login();

      if (response.success && response.user) {
        setUser(response.user);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true);

      const success = await authService.logout();

      if (success) {
        setUser(null);
        setError(null);
      }

      return success;
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getCurrentUser();

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
        setError("Failed to refresh user data");
      }
    } catch (err) {
      console.error("Refresh user error:", err);
      setUser(null);
      setError("Failed to refresh user data");
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token: authService.getToken(),
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export context for testing purposes
export { AuthContext };
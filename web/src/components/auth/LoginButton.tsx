// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import React, { useState } from "react";
import { useAuth } from "~/hooks/useAuth";
import { Button } from "~/components/ui/button";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

interface LoginButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
}

export function LoginButton({
  variant = "default",
  size = "default",
  className = "",
  children,
  onLoginSuccess,
  onLoginError,
}: LoginButtonProps) {
  const { login, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn || loading) return;

    try {
      setIsLoggingIn(true);

      const response = await login();

      if (response.success) {
        onLoginSuccess?.();
      } else {
        const errorMessage = response.error || "Login failed";
        onLoginError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      onLoginError?.(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isLoading = isLoggingIn || loading;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogin}
      disabled={isLoading}
      className={`relative ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          {children || "Sign in with Casdoor"}
        </>
      )}
    </Button>
  );
}

export function CasdoorLoginButton(props: Omit<LoginButtonProps, "children">) {
  return (
    <LoginButton {...props}>
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 6C9.23858 6 7 8.23858 7 11C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11C17 8.23858 14.7614 6 12 6Z"
            fill="currentColor"
          />
        </svg>
        Sign in with Casdoor
      </div>
    </LoginButton>
  );
}

export function LoginButtonWithStatus(props: LoginButtonProps) {
  const { error } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      <LoginButton {...props} />
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
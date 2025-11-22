// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/hooks/useAuth";
import { LoginButtonWithStatus } from "~/components/auth/LoginButton";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Loader2, Shield, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  const handleLoginSuccess = () => {
    router.push("/");
  };

  const handleLoginError = (error: string) => {
    console.error("Login failed:", error);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to access DeerFlow's AI research capabilities
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="space-y-6">
              {/* Login Button */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-center">
                  Sign in with your account
                </h2>

                <LoginButtonWithStatus
                  variant="default"
                  size="lg"
                  className="w-full"
                  onLoginSuccess={handleLoginSuccess}
                  onLoginError={handleLoginError}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5"
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
                    Continue with Casdoor
                  </div>
                </LoginButton>
              </div>

              {/* Security Notice */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Secure Authentication</p>
                    <p>
                      Your login is secured with Casdoor's enterprise-grade authentication.
                      We never store your password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
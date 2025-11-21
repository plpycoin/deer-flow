// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useAuth as useAuthContext } from "~/components/auth/AuthProvider";
import type { User } from "~/lib/auth";

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: () => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const auth = useAuthContext();
  return auth;
}

// Export type for external use
export type { User };
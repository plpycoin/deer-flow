// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { env } from "~/env";

// User interface matching the backend User model
export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar?: string;
  phone?: string;
  created_time?: string;
}

// Auth response from backend
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Auth status response
export interface AuthStatusResponse {
  success: boolean;
  authenticated: boolean;
  user?: User | null;
}

export class AuthService {
  private readonly API_URL = env.NEXT_PUBLIC_API_URL;
  private readonly CASDOOR_SERVER_URL = env.NEXT_PUBLIC_CASDOOR_SERVER_URL || "https://llm.biodesign.ac.cn";
  private readonly LOGIN_URL = env.NEXT_PUBLIC_LOGIN_URL || "/login";

  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Initialize token from localStorage
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
      this.user = this.getUserFromStorage();
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Get current user
  getUser(): User | null {
    return this.user;
  }

  // Set authentication data
  private setAuthData(token: string, user: User): void {
    this.token = token;
    this.user = user;

    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
    }
  }

  // Clear authentication data
  private clearAuthData(): void {
    this.token = null;
    this.user = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }

  // Get user from localStorage
  private getUserFromStorage(): User | null {
    if (typeof window === "undefined") return null;

    try {
      const userJson = localStorage.getItem("auth_user");
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }

  // Login with popup OAuth flow
  async login(): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        `${this.API_URL}/auth/login`,
        "casdoor-login",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        reject(new Error("Failed to open login popup"));
        return;
      }

      const messageHandler = async (event: MessageEvent) => {
        // Only accept messages from our origin
        if (event.origin !== window.location.origin) return;

        try {
          const response: AuthResponse = event.data;

          if (response.success && response.user && response.token) {
            this.setAuthData(response.token, response.user);
            resolve(response);
          } else {
            this.clearAuthData();
            resolve(response);
          }
        } catch (error) {
          console.error("Error processing auth response:", error);
          this.clearAuthData();
          reject(new Error("Authentication failed"));
        } finally {
          // Clean up
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
        }
      };

      // Listen for messages from the popup
      window.addEventListener("message", messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          resolve({ success: false, error: "Login cancelled" });
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
        if (popup && !popup.closed) {
          popup.close();
        }
        resolve({ success: false, error: "Login timeout" });
      }, 5 * 60 * 1000);
    });
  }

  // Logout user
  async logout(): Promise<boolean> {
    try {
      if (!this.token) {
        return true;
      }

      const response = await fetch(`${this.API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      // Clear local data regardless of response
      this.clearAuthData();

      return response.ok;
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local data even on error
      this.clearAuthData();
      return false;
    }
  }

  // Get current user from backend
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      if (!this.token) {
        return { success: false, error: "No token" };
      }

      const response = await fetch(`${this.API_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthData();
        }
        return { success: false, error: "Failed to get user" };
      }

      const data = await response.json();

      if (data.success && data.user) {
        this.user = data.user;
        return { success: true, user: data.user, token: this.token };
      }

      return { success: false, error: "Invalid response" };
    } catch (error) {
      console.error("Get current user error:", error);
      return { success: false, error: "Network error" };
    }
  }

  // Check authentication status
  async checkAuthStatus(): Promise<AuthStatusResponse> {
    try {
      const response = await fetch(`${this.API_URL}/auth/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { "Authorization": `Bearer ${this.token}` }),
        },
      });

      if (!response.ok) {
        return { success: true, authenticated: false, user: null };
      }

      const data = await response.json();

      if (data.success && data.authenticated && data.user) {
        this.user = data.user;
        return { success: true, authenticated: true, user: data.user };
      }

      return { success: true, authenticated: false, user: null };
    } catch (error) {
      console.error("Check auth status error:", error);
      return { success: true, authenticated: false, user: null };
    }
  }

  // Check if user is authenticated (token exists and is valid)
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired or invalid
      this.clearAuthData();
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Global auth service instance
export const authService = new AuthService();
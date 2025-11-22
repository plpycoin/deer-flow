// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { authService } from "./auth";

export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private addAuthHeaders(options: ApiClientOptions = {}): RequestInit {
    const { skipAuth, ...fetchOptions } = options;

    // Skip authentication if explicitly requested
    if (skipAuth) {
      return fetchOptions;
    }

    const token = authService.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
      ...(token && { "Authorization": `Bearer ${token}` }),
    };

    return {
      ...fetchOptions,
      headers,
    };
  }

  async get<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const url = this.baseUrl + endpoint;
    const fetchOptions = this.addAuthHeaders({
      method: "GET",
      ...options,
    });

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Token expired or invalid
      await authService.logout();
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const fetchOptions = this.addAuthHeaders({
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Token expired or invalid
      await authService.logout();
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response as unknown as T;
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const fetchOptions = this.addAuthHeaders({
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Token expired or invalid
      await authService.logout();
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const url = this.baseUrl + endpoint;
    const fetchOptions = this.addAuthHeaders({
      method: "DELETE",
      ...options,
    });

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Token expired or invalid
      await authService.logout();
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async fetch(endpoint: string, options: ApiClientOptions = {}): Promise<Response> {
    const url = this.baseUrl + endpoint;
    const fetchOptions = this.addAuthHeaders(options);

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Token expired or invalid
      await authService.logout();
      throw new Error("Authentication required");
    }

    return response;
  }
}

// Create a default API client instance
export const apiClient = new ApiClient();

// Export a convenience function for making authenticated fetch calls
export function authenticatedFetch(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  return apiClient.fetch(url, options);
}

// Export a function to create custom API clients
export function createApiClient(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
/**
 * YGO Legacy Authentication API Client
 * Replaces the MoeCube SSO authentication
 */

import { useConfig } from "@/config";

const { legacyApiUrl } = useConfig();

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
    token: string;
    // Compatibility fields for Neos
    name?: string;
    external_id?: number;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    username: string;
    password: string;
}

interface ApiError {
    error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || "An error occurred");
    }
    return response.json();
}

export async function register(data: RegisterData): Promise<AuthUser> {
    const response = await fetch(`${legacyApiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const result = await handleResponse<{ user: Omit<AuthUser, "token">; token: string }>(response);

    return {
        ...result.user,
        token: result.token,
        name: result.user.username, // Compatibility
    };
}

export async function login(data: LoginData): Promise<AuthUser> {
    const response = await fetch(`${legacyApiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const result = await handleResponse<{ user: Omit<AuthUser, "token">; token: string }>(response);

    return {
        ...result.user,
        token: result.token,
        name: result.user.username, // Compatibility
    };
}

export async function getMe(token: string): Promise<AuthUser | null> {
    try {
        const response = await fetch(`${legacyApiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return null;

        const result = await response.json();
        return {
            ...result.user,
            token,
            name: result.user.username,
        };
    } catch {
        return null;
    }
}

export async function updateProfile(
    token: string,
    updates: { username?: string; avatar_url?: string }
): Promise<AuthUser | null> {
    try {
        const response = await fetch(`${legacyApiUrl}/auth/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) return null;

        const result = await response.json();
        return {
            ...result.user,
            token,
            name: result.user.username,
        };
    } catch {
        return null;
    }
}

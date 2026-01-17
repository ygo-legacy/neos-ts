/**
 * Matchmaking API Client
 * 
 * Handles communication with the matchmaking microservice via WebSocket
 */

import { proxy } from "valtio";

interface MatchmakingState {
    connected: boolean;
    inQueue: boolean;
    queueSize: number;
    onlineUsers: Array<{ username: string; status: string }>;
    matchFound: MatchInfo | null;
    error: string | null;
    // Timeout state
    searchTimeoutExpired: boolean;
    searchStartTime: number | null;
}

interface MatchInfo {
    roomPassword: string;
    serverAddress: string;
    serverPort: number;
    opponent: string;
}

// Configuration
const SEARCH_TIMEOUT_MS = 30000; // 30 seconds

// Global state for matchmaking
export const matchmakingStore = proxy<MatchmakingState>({
    connected: false,
    inQueue: false,
    queueSize: 0,
    onlineUsers: [],
    matchFound: null,
    error: null,
    searchTimeoutExpired: false,
    searchStartTime: null,
});

// Helper to check if there are enough players for ranked
export function canPlayRanked(): boolean {
    // Need at least 2 users online (including self)
    return matchmakingStore.onlineUsers.length >= 2;
}

// Helper to get other online players count (excluding users in match)
export function getAvailablePlayersCount(): number {
    return matchmakingStore.onlineUsers.filter(u => u.status !== "in_match").length;
}

class MatchmakingClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;
    private searchTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    private currentToken: string | null = null;

    /**
     * Connect to matchmaking service
     */
    connect(token: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log("[Matchmaking] Already connected");
            return;
        }

        this.currentToken = token;
        const wsUrl = `ws://localhost:3001?token=${encodeURIComponent(token)}`;
        console.log("[Matchmaking] Connecting to:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log("[Matchmaking] Connected!");
            matchmakingStore.connected = true;
            matchmakingStore.error = null;
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error("[Matchmaking] Failed to parse message:", error);
            }
        };

        this.ws.onclose = (event) => {
            console.log("[Matchmaking] Connection closed:", event.code);
            matchmakingStore.connected = false;
            matchmakingStore.inQueue = false;
            this.clearSearchTimeout();

            // Attempt to reconnect if not intentionally closed
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts && this.currentToken) {
                this.reconnectAttempts++;
                console.log(`[Matchmaking] Reconnecting (attempt ${this.reconnectAttempts})...`);
                setTimeout(() => this.connect(this.currentToken!), this.reconnectDelay);
            }
        };

        this.ws.onerror = (error) => {
            console.error("[Matchmaking] WebSocket error:", error);
            matchmakingStore.error = "Connection error";
        };
    }

    /**
     * Disconnect from matchmaking service
     */
    disconnect(): void {
        this.clearSearchTimeout();
        if (this.ws) {
            this.ws.close(1000);
            this.ws = null;
            matchmakingStore.connected = false;
            matchmakingStore.inQueue = false;
        }
    }

    /**
     * Join ranked queue with timeout
     */
    joinQueue(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            matchmakingStore.error = "Not connected to matchmaking service";
            return;
        }

        // Reset timeout state
        matchmakingStore.searchTimeoutExpired = false;
        matchmakingStore.searchStartTime = Date.now();

        // Start timeout timer
        this.searchTimeoutTimer = setTimeout(() => {
            this.handleSearchTimeout();
        }, SEARCH_TIMEOUT_MS);

        this.ws.send(JSON.stringify({
            type: "join_queue",
            payload: {},
        }));
    }

    /**
     * Leave ranked queue
     */
    leaveQueue(): void {
        this.clearSearchTimeout();

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            matchmakingStore.inQueue = false;
            return;
        }

        this.ws.send(JSON.stringify({
            type: "leave_queue",
            payload: {},
        }));
    }

    /**
     * Clear search timeout
     */
    private clearSearchTimeout(): void {
        if (this.searchTimeoutTimer) {
            clearTimeout(this.searchTimeoutTimer);
            this.searchTimeoutTimer = null;
        }
        matchmakingStore.searchStartTime = null;
    }

    /**
     * Handle search timeout
     */
    private handleSearchTimeout(): void {
        console.log("[Matchmaking] Search timeout expired");
        matchmakingStore.searchTimeoutExpired = true;
        this.leaveQueue();
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(message: { type: string; payload: unknown }): void {
        console.log("[Matchmaking] Received:", message.type, message.payload);

        switch (message.type) {
            case "queue_joined":
                matchmakingStore.inQueue = true;
                matchmakingStore.queueSize = (message.payload as { position: number }).position;
                break;

            case "queue_left":
                matchmakingStore.inQueue = false;
                this.clearSearchTimeout();
                break;

            case "match_found":
                this.clearSearchTimeout();
                matchmakingStore.matchFound = message.payload as MatchInfo;
                matchmakingStore.inQueue = false;
                break;

            case "users_update":
                const payload = message.payload as { users: Array<{ user: { username: string }; status: string }> };
                matchmakingStore.onlineUsers = payload.users.map((u) => ({
                    username: u.user.username,
                    status: u.status,
                }));
                break;

            case "error":
                const errorPayload = message.payload as { message: string };
                if (errorPayload.message !== "pong") {
                    matchmakingStore.error = errorPayload.message;
                }
                break;
        }
    }
}

export const matchmakingClient = new MatchmakingClient();

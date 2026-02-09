/**
 * API client for backend communication using axios.
 */

import axios, { AxiosInstance } from "axios";
import {
  User,
  Task,
  TaskCreate,
  TaskUpdate,
  UserRegister,
  UserLogin,
  AuthToken,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Handle 401 errors (token expired)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only redirect to login if it's NOT a login or register request
        // (those should handle their own 401 errors)
        const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || 
                               error.config?.url?.includes('/api/auth/register');
        
        if (error.response?.status === 401 && !isAuthEndpoint) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async register(data: UserRegister): Promise<User> {
    const response = await this.client.post<User>("/api/auth/register", data);
    return response.data;
  }

  async login(data: UserLogin): Promise<AuthToken> {
    const response = await this.client.post<AuthToken>("/api/auth/login", data);
    return response.data;
  }

  async getCurrentUser(token?: string): Promise<User> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await this.client.get<User>("/api/auth/me", { headers });
    return response.data;
  }

  // Task endpoints
  async getTasks(userId: number): Promise<Task[]> {
    const response = await this.client.get<Task[]>(`/api/${userId}/tasks`);
    return response.data;
  }

  async getTask(userId: number, taskId: number): Promise<Task> {
    const response = await this.client.get<Task>(
      `/api/${userId}/tasks/${taskId}`
    );
    return response.data;
  }

  async createTask(userId: number, data: TaskCreate): Promise<Task> {
    const response = await this.client.post<Task>(
      `/api/${userId}/tasks`,
      data
    );
    return response.data;
  }

  async updateTask(
    userId: number,
    taskId: number,
    data: TaskUpdate
  ): Promise<Task> {
    const response = await this.client.put<Task>(
      `/api/${userId}/tasks/${taskId}`,
      data
    );
    return response.data;
  }

  async deleteTask(userId: number, taskId: number): Promise<void> {
    await this.client.delete(`/api/${userId}/tasks/${taskId}`);
  }

  // Chat endpoints
  async sendChatMessage(message: string, conversationId?: number): Promise<{ message: string; conversation_id: number }> {
    const response = await this.client.post("/api/chat", {
      message,
      conversation_id: conversationId,
    });
    return response.data;
  }

  async getConversations(): Promise<Array<{ id: number; created_at: string; updated_at: string; message_count: number }>> {
    const response = await this.client.get("/api/chat");
    return response.data;
  }

  async getConversation(conversationId: number): Promise<{
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    messages: Array<{ id: number; role: string; content: string; created_at: string }>;
  }> {
    const response = await this.client.get(`/api/chat/${conversationId}`);
    return response.data;
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.client.delete(`/api/chat/${conversationId}`);
  }
}

// Export singleton instance
export const api = new ApiClient();

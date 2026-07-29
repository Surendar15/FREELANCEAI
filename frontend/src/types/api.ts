// src/types/api.ts
// Generic API response types

export interface ApiError {
  error: string;
  message: string;
  details: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

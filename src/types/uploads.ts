// Upload-related interfaces for Tusky MCP Server

import { TuskyApiResponse } from "./api";

export interface InitiateUploadRequest {
  filename: string;
  mimeType: string;
  vaultId: string;
  parentId: string;
  size: number;
  encryptionKey?: string; // For encrypted vaults
  metadata?: Record<string, string>; // Additional metadata
}

export interface UploadSession {
  id: string;
  uploadUrl: string;
  expiresAt: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  size: number;
  bytesUploaded: number;
}

export interface InitiateUploadResponse extends TuskyApiResponse {
  data?: {
    upload: UploadSession;
    tusEndpoint: string;
    instructions: string;
  };
}

export interface GetUploadStatusResponse extends TuskyApiResponse {
  data?: {
    upload: UploadSession;
    progress: number; // Percentage of completion
    remainingBytes: number;
  };
}

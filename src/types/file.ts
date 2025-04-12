// src/types/file.ts

import { TuskyApiResponse } from './api';

/**
 * Parameters for listing files
 */
export interface ListFilesParams {
  vaultId: string;
  parentId?: string; // If not provided, lists root-level files
  status?: 'active' | 'archived' | 'deleted' | 'all';
  limit?: number;
  nextToken?: string;
}

/**
 * Response for listing files
 */
export interface ListFilesResponse extends TuskyApiResponse {
  data?: {
    files: FileItem[];
    nextToken?: string;
    totalCount?: number;
  };
}

/**
 * Parameters for getting a specific file
 */
export interface GetFileParams {
  id: string;
  vaultId: string;
  includeMetadata?: boolean;
}

/**
 * Response for getting a specific file
 */
export interface GetFileResponse extends TuskyApiResponse {
  data?: {
    file: FileDetails;
    metadata?: Record<string, any>;
  };
}

/**
 * File item as returned in listings
 */
export interface FileItem {
  id: string;
  name: string;
  vaultId: string;
  folderId?: string;
  type: string;
  size: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  contentType?: string;
}

/**
 * Detailed file information
 */
export interface FileDetails extends FileItem {
  description?: string;
  path?: string[];
  createdBy?: string;
  updatedBy?: string;
  etag?: string;
  version?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}
// src/types/metadata.ts

import { TuskyApiResponse } from './api';

/**
 * Parameters for getting file metadata
 */
export interface GetFileMetadataParams {
  id: string;
  vaultId: string;
  key?: string; // Optional specific metadata key to retrieve
}

/**
 * Response for getting file metadata
 */
export interface GetFileMetadataResponse extends TuskyApiResponse {
  data?: {
    metadata: Record<string, any>;
  };
}

/**
 * Parameters for updating file metadata
 */
export interface UpdateFileMetadataParams {
  id: string;
  vaultId: string;
  metadata: Record<string, any>; // The metadata to update or add
  merge?: boolean; // If true, merge with existing metadata; if false, replace entirely
}

/**
 * Response for updating file metadata
 */
export interface UpdateFileMetadataResponse extends TuskyApiResponse {
  data?: {
    metadata: Record<string, any>;
  };
}

/**
 * Parameters for deleting file metadata
 */
export interface DeleteFileMetadataParams {
  id: string;
  vaultId: string;
  key?: string; // Optional specific metadata key to delete, if not provided all metadata is deleted
}

/**
 * Response for deleting file metadata
 */
export interface DeleteFileMetadataResponse extends TuskyApiResponse {
  data?: {
    success: boolean;
    deletedKeys?: string[];
  };
}

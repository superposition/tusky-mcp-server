// src/types/folder.ts

import { TuskyApiResponse } from './api';

/**
 * Parameters for listing folders
 */
export interface ListFoldersParams {
  vaultId: string;
  parentId?: string; // If not provided, lists root-level folders
  status?: 'active' | 'archived' | 'deleted' | 'all';
  limit?: number;
  nextToken?: string;
}

/**
 * Response for listing folders
 */
export interface ListFoldersResponse extends TuskyApiResponse {
  data?: {
    folders: FolderItem[];
    nextToken?: string;
    totalCount?: number;
  };
}

/**
 * Parameters for getting a specific folder
 */
export interface GetFolderParams {
  id: string;
  vaultId: string;
  includeItems?: boolean;
}

/**
 * Response for getting a specific folder
 */
export interface GetFolderResponse extends TuskyApiResponse {
  data?: {
    folder: FolderDetails;
    items?: {
      files?: FileItem[];
      folders?: FolderItem[];
    };
  };
}

/**
 * Parameters for creating a folder
 */
export interface CreateFolderParams {
  name: string;
  vaultId: string;
  parentId?: string; // If not provided, creates at root level
  description?: string;
}

/**
 * Response for creating a folder
 */
export interface CreateFolderResponse extends TuskyApiResponse {
  data?: {
    folder: FolderDetails;
  };
}

/**
 * Parameters for updating a folder
 */
export interface UpdateFolderParams {
  id: string;
  vaultId: string;
  name?: string;
  parentId?: string; // Target folder to move to
  description?: string;
  status?: 'active' | 'archived' | 'deleted';
}

/**
 * Response for updating a folder
 */
export interface UpdateFolderResponse extends TuskyApiResponse {
  data?: {
    folder: FolderDetails;
  };
}

/**
 * Parameters for deleting a folder
 */
export interface DeleteFolderParams {
  id: string;
  vaultId: string;
  permanent?: boolean; // If true, permanently deletes the folder
}

/**
 * Response for deleting a folder
 */
export interface DeleteFolderResponse extends TuskyApiResponse {
  data?: {
    id: string;
    deleted: boolean;
    permanent: boolean;
  };
}

/**
 * Folder item as returned in listings
 */
export interface FolderItem {
  id: string;
  name: string;
  vaultId: string;
  parentId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

/**
 * Detailed folder information
 */
export interface FolderDetails extends FolderItem {
  description?: string;
  path?: string[];
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Basic file item information
 */
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size?: number;
  vaultId: string;
  folderId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

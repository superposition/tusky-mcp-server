// Search related type interfaces

import { Vault } from './vault';
import { Folder } from './folder';
import { File } from './file';
import { TuskyApiResponse } from './api';

/**
 * Search parameters for querying across vaults, folders, and files
 */
export interface SearchParams {
  // The query string to search for
  query: string;
  
  // Optional filters
  vaultId?: string;
  folderId?: string;
  type?: 'all' | 'vault' | 'folder' | 'file';
  status?: 'active' | 'archived' | 'deleted';
  tags?: string[];
  
  // Pagination parameters
  limit?: number;
  nextToken?: string;
}

/**
 * A search result item which can be a vault, folder, or file
 */
export interface SearchResultItem {
  id: string;
  name: string;
  type: 'vault' | 'folder' | 'file';
  path?: string;
  contentType?: string;
  createdAt: string;
  updatedAt?: string;
  vaultId?: string;
  parentId?: string;
  matchInfo?: {
    field: string;
    snippet: string;
  }[];
}

/**
 * Search response from the API
 */
export interface SearchResponse extends TuskyApiResponse {
  data?: {
    items: SearchResultItem[];
    totalResults?: number;
    nextToken?: string;
  };
}

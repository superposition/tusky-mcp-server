// src/services/folderClient.ts

import { ApiClient } from './apiClient';
import {
  ListFoldersParams,
  ListFoldersResponse,
  GetFolderParams,
  GetFolderResponse,
  CreateFolderParams,
  CreateFolderResponse,
  UpdateFolderParams,
  UpdateFolderResponse,
  DeleteFolderParams,
  DeleteFolderResponse
} from '../types/folder';

/**
 * Client for interacting with Tusky Folder API endpoints
 */
export class FolderClient {
  private apiClient: ApiClient;
  private basePath = '/folders';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * List folders according to the provided parameters
   * @param params Parameters for filtering and pagination
   * @returns Promise with the list of folders
   */
  public async listFolders(params: ListFoldersParams): Promise<ListFoldersResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    if (params.parentId) {
      queryParams.append('parentId', params.parentId);
    }
    
    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.get<ListFoldersResponse>(url);
  }

  /**
   * Get detailed information about a specific folder
   * @param params Parameters specifying the folder ID and optional includes
   * @returns Promise with the folder details
   */
  public async getFolder(params: GetFolderParams): Promise<GetFolderResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    if (params.includeItems) {
      queryParams.append('includeItems', 'true');
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.get<GetFolderResponse>(url);
  }

  /**
   * Create a new folder
   * @param params Parameters for the new folder
   * @returns Promise with the created folder details
   */
  public async createFolder(params: CreateFolderParams): Promise<CreateFolderResponse> {
    return this.apiClient.post<CreateFolderResponse>(this.basePath, params);
  }

  /**
   * Update an existing folder
   * @param params Parameters for the folder update
   * @returns Promise with the updated folder details
   */
  public async updateFolder(params: UpdateFolderParams): Promise<UpdateFolderResponse> {
    return this.apiClient.post<UpdateFolderResponse>(`${this.basePath}/${params.id}`, params);
  }

  /**
   * Delete a folder
   * @param params Parameters for the folder deletion
   * @returns Promise with the deletion status
   */
  public async deleteFolder(params: DeleteFolderParams): Promise<DeleteFolderResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    if (params.permanent) {
      queryParams.append('permanent', 'true');
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.delete<DeleteFolderResponse>(url);
  }

  /**
   * Check if a folder exists and is accessible to the current user
   * @param id The folder ID to check
   * @param vaultId The vault ID the folder belongs to
   * @returns Promise with boolean indicating if folder exists and is accessible
   */
  public async folderExists(id: string, vaultId: string): Promise<boolean> {
    try {
      await this.getFolder({ id, vaultId });
      return true;
    } catch (error) {
      // If error status is 404, folder doesn't exist or isn't accessible
      if (error?.response?.status === 404) {
        return false;
      }
      // Rethrow other errors
      throw error;
    }
  }
}

/**
 * Create a folder client instance using the provided API client
 * @param apiClient The API client to use for requests
 * @returns A configured FolderClient instance
 */
export function createFolderClient(apiClient: ApiClient): FolderClient {
  return new FolderClient(apiClient);
}

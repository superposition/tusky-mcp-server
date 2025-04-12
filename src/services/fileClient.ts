// src/services/fileClient.ts

import { ApiClient } from './apiClient';
import {
  ListFilesParams,
  ListFilesResponse,
  GetFileParams,
  GetFileResponse
} from '../types/file';

/**
 * Client for interacting with Tusky File API endpoints
 */
export class FileClient {
  private apiClient: ApiClient;
  private basePath = '/files';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * List files according to the provided parameters
   * @param params Parameters for filtering and pagination
   * @returns Promise with the list of files
   */
  public async listFiles(params: ListFilesParams): Promise<ListFilesResponse> {
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
    
    return this.apiClient.get<ListFilesResponse>(url);
  }

  /**
   * Get detailed information about a specific file
   * @param params Parameters specifying the file ID and optional includes
   * @returns Promise with the file details
   */
  public async getFile(params: GetFileParams): Promise<GetFileResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    if (params.includeMetadata) {
      queryParams.append('includeMetadata', 'true');
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.get<GetFileResponse>(url);
  }

  /**
   * Check if a file exists and is accessible to the current user
   * @param id The file ID to check
   * @param vaultId The vault ID the file belongs to
   * @returns Promise with boolean indicating if file exists and is accessible
   */
  public async fileExists(id: string, vaultId: string): Promise<boolean> {
    try {
      await this.getFile({ id, vaultId });
      return true;
    } catch (error) {
      // If error status is 404, file doesn't exist or isn't accessible
      if (error?.response?.status === 404) {
        return false;
      }
      // Rethrow other errors
      throw error;
    }
  }
}

/**
 * Create a file client instance using the provided API client
 * @param apiClient The API client to use for requests
 * @returns A configured FileClient instance
 */
export function createFileClient(apiClient: ApiClient): FileClient {
  return new FileClient(apiClient);
}
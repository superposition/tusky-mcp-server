// src/services/metadataClient.ts

import { ApiClient } from './apiClient';
import {
  GetFileMetadataParams,
  GetFileMetadataResponse,
  UpdateFileMetadataParams,
  UpdateFileMetadataResponse,
  DeleteFileMetadataParams,
  DeleteFileMetadataResponse
} from '../types/metadata';

/**
 * Client for interacting with Tusky file metadata API endpoints
 */
export class MetadataClient {
  private apiClient: ApiClient;
  private basePath = '/files';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get metadata for a specific file
   * @param params Parameters for the metadata request
   * @returns Promise with file metadata
   */
  public async getFileMetadata(params: GetFileMetadataParams): Promise<GetFileMetadataResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    // Optional key parameter
    if (params.key) {
      queryParams.append('key', params.key);
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}/metadata${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.get<GetFileMetadataResponse>(url);
  }

  /**
   * Update metadata for a specific file
   * @param params Parameters for the metadata update
   * @returns Promise with updated metadata
   */
  public async updateFileMetadata(params: UpdateFileMetadataParams): Promise<UpdateFileMetadataResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    // Optional merge parameter
    if (params.merge !== undefined) {
      queryParams.append('merge', params.merge.toString());
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}/metadata${queryString ? `?${queryString}` : ''}`;
    
    // Send metadata in request body
    return this.apiClient.post<UpdateFileMetadataResponse>(url, { metadata: params.metadata });
  }

  /**
   * Delete metadata for a specific file
   * @param params Parameters for the metadata deletion
   * @returns Promise with deletion status
   */
  public async deleteFileMetadata(params: DeleteFileMetadataParams): Promise<DeleteFileMetadataResponse> {
    const queryParams = new URLSearchParams();
    
    // Required vaultId parameter
    queryParams.append('vaultId', params.vaultId);
    
    // Optional key parameter
    if (params.key) {
      queryParams.append('key', params.key);
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}/metadata${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.delete<DeleteFileMetadataResponse>(url);
  }
}

/**
 * Create a metadata client instance using the provided API client
 * @param apiClient The API client to use for requests
 * @returns A configured MetadataClient instance
 */
export function createMetadataClient(apiClient: ApiClient): MetadataClient {
  return new MetadataClient(apiClient);
}

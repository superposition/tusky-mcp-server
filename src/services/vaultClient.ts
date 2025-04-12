// src/services/vaultClient.ts

import { ApiClient } from './apiClient';
import {
  ListVaultsParams,
  ListVaultsResponse,
  GetVaultParams,
  GetVaultResponse
} from '../types/vault';
import { FolderClient, createFolderClient } from './folderClient';
import { FileClient, createFileClient } from './fileClient';

/**
 * Client for interacting with Tusky Vault API endpoints
 */
export class VaultClient {
  private apiClient: ApiClient;
  private basePath = '/vaults';
  private _folderClient: FolderClient | null = null;
  private _fileClient: FileClient | null = null;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get the folder client for folder operations
   */
  public get folders(): FolderClient {
    if (!this._folderClient) {
      this._folderClient = createFolderClient(this.apiClient);
    }
    return this._folderClient;
  }

  /**
   * Get the file client for file operations
   */
  public get files(): FileClient {
    if (!this._fileClient) {
      this._fileClient = createFileClient(this.apiClient);
    }
    return this._fileClient;
  }

  /**
   * List vaults according to the provided parameters
   * @param params Optional parameters for filtering and pagination
   * @returns Promise with the list of vaults
   */
  public async listVaults(params?: ListVaultsParams): Promise<ListVaultsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }
    
    if (params?.ownedOnly !== undefined) {
      queryParams.append('ownedOnly', params.ownedOnly.toString());
    }
    
    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.get<ListVaultsResponse>(url);
  }

  /**
   * Get detailed information about a specific vault
   * @param params Parameters specifying the vault ID and optional includes
   * @returns Promise with the vault details
   */
  public async getVault(params: GetVaultParams): Promise<GetVaultResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.includePermissions) {
      queryParams.append('includePermissions', 'true');
    }
    
    if (params.includeFiles) {
      queryParams.append('includeFiles', 'true');
    }
    
    if (params.includeFolders) {
      queryParams.append('includeFolders', 'true');
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}/${params.id}${queryString ? `?${queryString}` : ''}`;
    
    return this.apiClient.get<GetVaultResponse>(url);
  }

  /**
   * Check if a vault exists and is accessible to the current user
   * @param id The vault ID to check
   * @returns Promise with boolean indicating if vault exists and is accessible
   */
  public async vaultExists(id: string): Promise<boolean> {
    try {
      await this.getVault({ id });
      return true;
    } catch (error) {
      // If error status is 404, vault doesn't exist or isn't accessible
      if (error?.response?.status === 404) {
        return false;
      }
      // Rethrow other errors
      throw error;
    }
  }
}

/**
 * Create a vault client instance using the provided API client
 * @param apiClient The API client to use for requests
 * @returns A configured VaultClient instance
 */
export function createVaultClient(apiClient: ApiClient): VaultClient {
  return new VaultClient(apiClient);
}
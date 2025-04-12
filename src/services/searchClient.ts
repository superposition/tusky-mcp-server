// src/services/searchClient.ts

import { ApiClient } from './apiClient';
import { SearchParams, SearchResponse } from '../types/search';

/**
 * Client for interacting with Tusky Search API endpoints
 */
export class SearchClient {
  private apiClient: ApiClient;
  private basePath = '/search';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Search across vaults, folders, and files
   * @param params Search parameters
   * @returns Promise with the search results
   */
  public async search(params: SearchParams): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    
    // Required parameter
    queryParams.append('query', params.query);
    
    // Optional filters
    if (params.vaultId) {
      queryParams.append('vaultId', params.vaultId);
    }
    
    if (params.folderId) {
      queryParams.append('folderId', params.folderId);
    }
    
    if (params.type && params.type !== 'all') {
      queryParams.append('type', params.type);
    }
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    
    // Pagination
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const queryString = queryParams.toString();
    const url = `${this.basePath}?${queryString}`;
    
    try {
      return await this.apiClient.get<SearchResponse>(url);
    } catch (error: any) {
      console.error('Search error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to search for content',
      };
    }
  }
}

/**
 * Create a search client instance using the provided API client
 * @param apiClient The API client to use for requests
 * @returns A configured SearchClient instance
 */
export function createSearchClient(apiClient: ApiClient): SearchClient {
  return new SearchClient(apiClient);
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApiKeys, createApiKey, deleteApiKey } from '../tools/apiKeys';
import { apiClient } from '../services/apiClient';

// Mock the API client
vi.mock('../services/apiClient', () => ({
  apiClient: {
    getAuthToken: vi.fn(),
    getApiKeys: vi.fn(),
    createApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
  }
}));

describe('API Key Management Tools', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getApiKeys', () => {
    it('should return error if user is not authenticated', async () => {
      // Mock authentication check to return null (not authenticated)
      vi.mocked(apiClient.getAuthToken).mockReturnValue(null);

      const result = await getApiKeys();

      // Should return an error response
      expect(result.success).toBe(false);
      expect(result.error).toBe('authentication_required');
      // Should not call the API client
      expect(apiClient.getApiKeys).not.toHaveBeenCalled();
    });

    it('should return API keys if user is authenticated', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');
      
      // Mock API response
      const mockApiResponse = {
        success: true,
        data: {
          keys: [
            {
              id: 'key1',
              name: 'Test Key 1',
              prefix: 'tsk_1',
              createdAt: '2025-04-01T00:00:00Z'
            },
            {
              id: 'key2',
              name: 'Test Key 2',
              prefix: 'tsk_2',
              createdAt: '2025-04-02T00:00:00Z'
            }
          ]
        }
      };
      
      vi.mocked(apiClient.getApiKeys).mockResolvedValue(mockApiResponse);

      const result = await getApiKeys();

      // Should call the API client
      expect(apiClient.getApiKeys).toHaveBeenCalledTimes(1);
      // Should return the successful response
      expect(result).toEqual(mockApiResponse);
      expect(result.data?.keys).toHaveLength(2);
    });

    it('should handle API errors correctly', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');
      
      // Mock API error response
      const mockErrorResponse = {
        success: false,
        error: 'api_error',
        message: 'Failed to retrieve API keys'
      };
      
      vi.mocked(apiClient.getApiKeys).mockResolvedValue(mockErrorResponse);

      const result = await getApiKeys();

      // Should call the API client
      expect(apiClient.getApiKeys).toHaveBeenCalledTimes(1);
      // Should return the error response
      expect(result.success).toBe(false);
      expect(result.error).toBe('api_error');
    });
  });

  describe('createApiKey', () => {
    it('should return error if user is not authenticated', async () => {
      // Mock authentication check to return null (not authenticated)
      vi.mocked(apiClient.getAuthToken).mockReturnValue(null);

      const result = await createApiKey({ name: 'Test Key' });

      // Should return an error response
      expect(result.success).toBe(false);
      expect(result.error).toBe('authentication_required');
      // Should not call the API client
      expect(apiClient.createApiKey).not.toHaveBeenCalled();
    });

    it('should validate key name', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');

      // Test with empty name
      const result = await createApiKey({ name: '' });

      // Should return validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      // Should not call the API client
      expect(apiClient.createApiKey).not.toHaveBeenCalled();
    });

    it('should validate expiresInDays if provided', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');

      // Test with negative expiration
      const result = await createApiKey({ name: 'Test Key', expiresInDays: -5 });

      // Should return validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      // Should not call the API client
      expect(apiClient.createApiKey).not.toHaveBeenCalled();
    });

    it('should create API key with valid parameters', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');
      
      // Mock API response
      const mockApiResponse = {
        success: true,
        data: {
          key: {
            id: 'new-key-id',
            name: 'Test Key',
            prefix: 'tsk_new',
            createdAt: '2025-04-12T00:00:00Z'
          },
          secretKey: 'tsk_secret_key_value'
        }
      };
      
      vi.mocked(apiClient.createApiKey).mockResolvedValue(mockApiResponse);

      const result = await createApiKey({ name: 'Test Key', expiresInDays: 30 });

      // Should call the API client with correct parameters
      expect(apiClient.createApiKey).toHaveBeenCalledWith('Test Key', 30);
      // Should return the successful response
      expect(result).toEqual(mockApiResponse);
      expect(result.data?.key.name).toBe('Test Key');
      expect(result.data?.secretKey).toBe('tsk_secret_key_value');
    });
  });

  describe('deleteApiKey', () => {
    it('should return error if user is not authenticated', async () => {
      // Mock authentication check to return null (not authenticated)
      vi.mocked(apiClient.getAuthToken).mockReturnValue(null);

      const result = await deleteApiKey({ keyId: 'key-to-delete' });

      // Should return an error response
      expect(result.success).toBe(false);
      expect(result.error).toBe('authentication_required');
      // Should not call the API client
      expect(apiClient.deleteApiKey).not.toHaveBeenCalled();
    });

    it('should validate key ID', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');

      // Test with empty key ID
      const result = await deleteApiKey({ keyId: '' });

      // Should return validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      // Should not call the API client
      expect(apiClient.deleteApiKey).not.toHaveBeenCalled();
    });

    it('should delete API key with valid ID', async () => {
      // Mock authentication check to return a token
      vi.mocked(apiClient.getAuthToken).mockReturnValue('mock-token');
      
      // Mock API response
      const mockApiResponse = {
        success: true,
        data: {
          id: 'key-to-delete',
          deleted: true
        }
      };
      
      vi.mocked(apiClient.deleteApiKey).mockResolvedValue(mockApiResponse);

      const result = await deleteApiKey({ keyId: 'key-to-delete' });

      // Should call the API client with correct parameters
      expect(apiClient.deleteApiKey).toHaveBeenCalledWith('key-to-delete');
      // Should return the successful response
      expect(result).toEqual(mockApiResponse);
      expect(result.data?.id).toBe('key-to-delete');
      expect(result.data?.deleted).toBe(true);
    });
  });
});

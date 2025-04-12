import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthManager } from '../services/authManager';
import { apiClient } from '../services/apiClient';
import { VerifyChallengeResponse } from '../types/api';

// Mock the API client
vi.mock('../services/apiClient', () => ({
  apiClient: {
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  }
}));

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    // Create a fresh AuthManager for each test
    authManager = new AuthManager();
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('API Key Management', () => {
    it('should initially have no API key', () => {
      expect(authManager.getApiKeyInfo()).toBeNull();
      expect(authManager.getApiToken()).toBeNull();
    });

    it('should set and get API key information', () => {
      const keyInfo = {
        token: 'tsk_test_api_key_123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        userId: 'user123'
      };

      authManager.setApiKey(keyInfo);

      expect(authManager.getApiKeyInfo()).toEqual(keyInfo);
      expect(authManager.getApiToken()).toBe(keyInfo.token);
      // Should update API client
      expect(apiClient.setAuthToken).toHaveBeenCalledWith(keyInfo.token);
    });

    it('should clear API key information', () => {
      // First set an API key
      const keyInfo = {
        token: 'tsk_test_api_key_123',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
      authManager.setApiKey(keyInfo);

      // Then clear it
      authManager.clearApiKey();

      expect(authManager.getApiKeyInfo()).toBeNull();
      expect(authManager.getApiToken()).toBeNull();
      // Should update API client
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });

    it('should validate API key format correctly', () => {
      // Valid key
      expect(AuthManager.isValidApiKeyFormat('tsk_test_valid_key_12345')).toBe(true);
      
      // Invalid keys
      expect(AuthManager.isValidApiKeyFormat('')).toBe(false);
      expect(AuthManager.isValidApiKeyFormat('   ')).toBe(false);
      expect(AuthManager.isValidApiKeyFormat('invalid_key')).toBe(false);
      expect(AuthManager.isValidApiKeyFormat('tsk_')).toBe(false);
      expect(AuthManager.isValidApiKeyFormat(null)).toBe(false);
      expect(AuthManager.isValidApiKeyFormat(undefined)).toBe(false);
    });
  });

  describe('Authentication State Management', () => {
    it('should store authentication from a valid verify response', () => {
      const mockResponse: VerifyChallengeResponse = {
        success: true,
        data: {
          token: 'tsk_valid_token_123',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      };

      const result = authManager.storeAuthFromVerifyResponse(mockResponse);

      expect(result).toBe(true);
      expect(authManager.getApiToken()).toBe('tsk_valid_token_123');
      expect(apiClient.setAuthToken).toHaveBeenCalledWith('tsk_valid_token_123');
    });

    it('should not store authentication from an invalid verify response', () => {
      const mockResponse: VerifyChallengeResponse = {
        success: false,
        error: 'auth_error',
        message: 'Authentication failed'
      };

      const result = authManager.storeAuthFromVerifyResponse(mockResponse);

      expect(result).toBe(false);
      expect(authManager.getApiToken()).toBeNull();
      expect(apiClient.setAuthToken).not.toHaveBeenCalled();
    });

    it('should correctly identify valid non-expired API key', () => {
      // Set a non-expired key
      authManager.setApiKey({
        token: 'tsk_valid_token',
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      });

      expect(authManager.isApiKeyValid()).toBe(true);
    });

    it('should correctly identify expired API key', () => {
      // Set an expired key
      authManager.setApiKey({
        token: 'tsk_expired_token',
        expiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      });

      expect(authManager.isApiKeyValid()).toBe(false);
    });

    it('should handle API keys without expiration', () => {
      // Set a key without expiration
      authManager.setApiKey({
        token: 'tsk_no_expiration'
      });

      expect(authManager.isApiKeyValid()).toBe(true);
    });

    it('should handle null/missing API key', () => {
      expect(authManager.isApiKeyValid()).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChallenge, verifyChallenge, checkAuthStatus } from '../tools/authentication';
import { getApiKeys, createApiKey, deleteApiKey } from '../tools/apiKeys';
import { apiClient } from '../services/apiClient';
import { authManager } from '../services/authManager';

// Mock the API client and auth manager
vi.mock('../services/apiClient', () => ({
  apiClient: {
    createChallenge: vi.fn(),
    verifyChallenge: vi.fn(),
    getApiKeys: vi.fn(),
    createApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
    getAuthToken: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  }
}));

vi.mock('../services/authManager', () => ({
  authManager: {
    storeAuthFromVerifyResponse: vi.fn(),
    isApiKeyValid: vi.fn(),
    getApiKeyInfo: vi.fn(),
    getApiToken: vi.fn(),
  }
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('End-to-End Authentication Flow', () => {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const signature = 'signed_challenge_123';
    const nonce = 'test_nonce_123';
    
    it('should authenticate and persist state across operations', async () => {
      // Mock API responses
      const mockChallengeResponse = {
        success: true,
        data: {
          nonce: nonce,
          timestamp: new Date().toISOString(),
          expiresIn: 3600
        }
      };
      
      const mockVerifyResponse = {
        success: true,
        data: {
          token: 'tsk_auth_token_123',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      };
      
      const mockApiKeysResponse = {
        success: true,
        data: {
          keys: [
            {
              id: 'key1',
              name: 'Test Key 1',
              prefix: 'tsk_1',
              createdAt: new Date().toISOString()
            }
          ]
        }
      };
      
      // Setup mocks
      vi.mocked(apiClient.createChallenge).mockResolvedValue(mockChallengeResponse);
      vi.mocked(apiClient.verifyChallenge).mockResolvedValue(mockVerifyResponse);
      vi.mocked(apiClient.getApiKeys).mockResolvedValue(mockApiKeysResponse);
      vi.mocked(authManager.storeAuthFromVerifyResponse).mockReturnValue(true);
      vi.mocked(authManager.isApiKeyValid).mockReturnValue(true);
      vi.mocked(authManager.getApiToken).mockReturnValue('tsk_auth_token_123');

      // 1. Request authentication challenge
      const challengeResult = await createChallenge({ walletAddress });
      expect(challengeResult.success).toBe(true);
      expect(challengeResult.data?.nonce).toBe(nonce);
      
      // 2. Verify challenge with signature
      const verifyResult = await verifyChallenge({
        walletAddress,
        signature,
        nonce
      });
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.data?.token).toBe('tsk_auth_token_123');
      
      // Verify authentication was stored
      expect(authManager.storeAuthFromVerifyResponse).toHaveBeenCalledWith(mockVerifyResponse);
      
      // 3. Check authentication status
      vi.mocked(authManager.getApiKeyInfo).mockReturnValue({
        token: 'tsk_auth_token_123',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });
      
      const statusResult = await checkAuthStatus();
      expect(statusResult.success).toBe(true);
      expect(statusResult.message).toContain('authenticated');
      
      // 4. Use authentication for API key management
      const getKeysResult = await getApiKeys();
      expect(getKeysResult.success).toBe(true);
      expect(getKeysResult.data?.keys).toHaveLength(1);
      
      // Verify API client was called with proper auth
      expect(apiClient.getApiKeys).toHaveBeenCalled();
    });
    
    it('should fail operations when not authenticated', async () => {
      // Setup mocks for unauthenticated state
      vi.mocked(authManager.isApiKeyValid).mockReturnValue(false);
      vi.mocked(authManager.getApiToken).mockReturnValue(null);
      
      // Try to get API keys without authentication
      const getKeysResult = await getApiKeys();
      
      expect(getKeysResult.success).toBe(false);
      expect(getKeysResult.error).toBe('authentication_required');
      expect(apiClient.getApiKeys).not.toHaveBeenCalled();
      
      // Check auth status shows not authenticated
      const statusResult = await checkAuthStatus();
      expect(statusResult.success).toBe(false);
      expect(statusResult.error).toBe('not_authenticated');
    });
    
    it('should handle token expiration gracefully', async () => {
      // Setup expired token scenario
      vi.mocked(authManager.getApiKeyInfo).mockReturnValue({
        token: 'tsk_expired_token',
        expiresAt: new Date(Date.now() - 3600000).toISOString() // expired 1 hour ago
      });
      vi.mocked(authManager.isApiKeyValid).mockReturnValue(false);
      
      // Check auth status
      const statusResult = await checkAuthStatus();
      expect(statusResult.success).toBe(false);
      expect(statusResult.message).toContain('expired');
      
      // Try to use expired token
      const getKeysResult = await getApiKeys();
      expect(getKeysResult.success).toBe(false);
      expect(getKeysResult.error).toBe('authentication_required');
    });
  });
});

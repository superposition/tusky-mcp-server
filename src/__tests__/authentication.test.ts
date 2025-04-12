import { createChallenge, verifyChallenge } from '../tools/authentication';
import { apiClient } from '../services/apiClient';

// Mock the API client
jest.mock('../services/apiClient', () => ({
  apiClient: {
    createChallenge: jest.fn(),
    verifyChallenge: jest.fn(),
  },
}));

describe('Authentication Challenge Tools', () => {
  // Reset mock calls between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChallenge', () => {
    it('should return error for invalid wallet address', async () => {
      // Test with invalid wallet address format
      const result = await createChallenge({ walletAddress: 'invalid-address' });
      
      // Should return error without calling API
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      expect(apiClient.createChallenge).not.toHaveBeenCalled();
    });

    it('should call API client with valid wallet address', async () => {
      // Mock the API response
      const mockResponse = {
        success: true,
        data: {
          nonce: 'abc123',
          timestamp: new Date().toISOString(),
          expiresIn: 300
        }
      };
      
      // Set mock implementation for this test
      (apiClient.createChallenge as jest.Mock).mockResolvedValue(mockResponse);
      
      // Call with valid wallet address
      const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const result = await createChallenge({ walletAddress: validAddress });
      
      // Should call API and return successful response
      expect(apiClient.createChallenge).toHaveBeenCalledWith(validAddress);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyChallenge', () => {
    it('should return error for invalid wallet address', async () => {
      // Test with invalid inputs
      const result = await verifyChallenge({ 
        walletAddress: 'invalid-address',
        signature: 'valid-signature',
        nonce: 'valid-nonce'
      });
      
      // Should return error without calling API
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
    });

    it('should return error for missing signature', async () => {
      // Test with missing signature
      const result = await verifyChallenge({ 
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: '',
        nonce: 'valid-nonce'
      });
      
      // Should return error without calling API
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
    });

    it('should return error for missing nonce', async () => {
      // Test with missing nonce
      const result = await verifyChallenge({ 
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature',
        nonce: ''
      });
      
      // Should return error without calling API
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
      expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
    });

    it('should call API client with valid inputs', async () => {
      // Mock the API response
      const mockResponse = {
        success: true,
        data: {
          token: 'jwt-token-123',
          expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        }
      };
      
      // Set mock implementation for this test
      (apiClient.verifyChallenge as jest.Mock).mockResolvedValue(mockResponse);
      
      // Call with valid inputs
      const validParams = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature-123456',
        nonce: 'nonce-123456'
      };
      
      const result = await verifyChallenge(validParams);
      
      // Should call API and return successful response
      expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
        validParams.walletAddress,
        validParams.signature,
        validParams.nonce
      );
      
      expect(result).toEqual(mockResponse);
    });
  });
});

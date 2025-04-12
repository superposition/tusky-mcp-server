// src/tests/user.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserClient } from '../clients/user';
import { ApiClient } from '../services/apiClient';
import { GetProfileParams, UpdateProfileParams } from '../types/user';

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  patch: vi.fn(),
} as unknown as ApiClient;

describe('User Client', () => {
  let userClient: UserClient;
  
  beforeEach(() => {
    userClient = new UserClient(mockApiClient);
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('getProfile', () => {
    it('should fetch user profile without storage information', async () => {
      // Set up mock response
      const mockResponse = {
        profile: {
          id: 'user123',
          name: 'Test User',
          bio: 'Test bio',
          walletAddress: '0x1234567890abcdef',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      // Call the function
      const params: GetProfileParams = { includeStorage: false };
      const result = await userClient.getProfile(params);
      
      // Assert on the results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/profile');
    });
    
    it('should fetch user profile with storage information', async () => {
      // Set up mock response
      const mockResponse = {
        profile: {
          id: 'user123',
          name: 'Test User',
          bio: 'Test bio',
          walletAddress: '0x1234567890abcdef',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        storage: {
          total: 1024 * 1024 * 1024, // 1GB
          used: 512 * 1024 * 1024, // 512MB
          plan: 'Standard',
          expiresAt: null
        }
      };
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      // Call the function
      const params: GetProfileParams = { includeStorage: true };
      const result = await userClient.getProfile(params);
      
      // Assert on the results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/profile?includeStorage=true');
    });
    
    it('should handle API errors', async () => {
      // Set up mock error
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);
      
      // Call the function
      const params: GetProfileParams = { includeStorage: false };
      const result = await userClient.getProfile(params);
      
      // Assert on the results
      expect(result.success).toBe(false);
      expect(result.error).toBe('Error');
      expect(result.message).toBe('Network error');
    });
  });
  
  describe('updateProfile', () => {
    it('should update user profile with name and bio', async () => {
      // Set up mock response
      const mockResponse = {
        profile: {
          id: 'user123',
          name: 'Updated Name',
          bio: 'Updated bio',
          walletAddress: '0x1234567890abcdef',
          updatedAt: new Date().toISOString()
        }
      };
      mockApiClient.patch.mockResolvedValue(mockResponse);
      
      // Call the function
      const params: UpdateProfileParams = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };
      const result = await userClient.updateProfile(params);
      
      // Assert on the results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/users/profile', params);
    });
    
    it('should update user profile with preferences', async () => {
      // Set up mock response
      const mockResponse = {
        profile: {
          id: 'user123',
          name: 'Test User',
          walletAddress: '0x1234567890abcdef',
          preferences: {
            theme: 'dark',
            notifications: true
          },
          updatedAt: new Date().toISOString()
        }
      };
      mockApiClient.patch.mockResolvedValue(mockResponse);
      
      // Call the function
      const params: UpdateProfileParams = {
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };
      const result = await userClient.updateProfile(params);
      
      // Assert on the results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/users/profile', params);
    });
    
    it('should handle API errors', async () => {
      // Set up mock error
      const mockError = new Error('Bad request');
      mockApiClient.patch.mockRejectedValue(mockError);
      
      // Call the function
      const params: UpdateProfileParams = {
        name: 'Updated Name'
      };
      const result = await userClient.updateProfile(params);
      
      // Assert on the results
      expect(result.success).toBe(false);
      expect(result.error).toBe('Error');
      expect(result.message).toBe('Bad request');
    });
  });
});

// Tests for user profile tools
describe('User Profile Tools', () => {
  // Note: These tests would typically involve the TuskyMcpServer class
  // and would test the registerUserTools function and the tool executors.
  // For simplicity, we are focusing on the client functionality above.
  
  // In a full testing suite, we would mock the TuskyMcpServer and 
  // test the tool registration and execution flow as well.
});

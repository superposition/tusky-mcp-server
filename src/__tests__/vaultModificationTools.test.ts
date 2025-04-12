// src/__tests__/vaultModificationTools.test.ts

import { VaultClient } from '../services/vaultClient';
import { ApiClient } from '../services/apiClient';
import { 
  CreateVaultParams, 
  UpdateVaultParams, 
  DeleteVaultParams 
} from '../types/vault';
import { TuskyMcpServer } from '../index';

// Mock the ApiClient
jest.mock('../services/apiClient', () => {
  return {
    ApiClient: jest.fn().mockImplementation(() => {
      return {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        setApiKey: jest.fn()
      };
    })
  };
});

// Mock the authManager
jest.mock('../services/authManager', () => {
  return {
    authManager: {
      isApiKeyValid: jest.fn().mockReturnValue(true),
      getApiKey: jest.fn().mockReturnValue('mock-api-key'),
      setApiKey: jest.fn()
    }
  };
});

describe('VaultClient - Modification Methods', () => {
  let vaultClient: VaultClient;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    mockApiClient = new ApiClient() as jest.Mocked<ApiClient>;
    vaultClient = new VaultClient(mockApiClient);
  });

  describe('createVault', () => {
    it('should call the API with correct parameters', async () => {
      // Mock the API response
      const mockResponse = {
        success: true,
        data: {
          vault: { 
            id: 'vault-123', 
            name: 'New Test Vault', 
            ownerId: 'user-1',
            createdAt: '2025-04-01T12:00:00Z',
            updatedAt: '2025-04-01T12:00:00Z',
            status: 'active' as const,
            isEncrypted: true,
            tags: ['test', 'development']
          }
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      // Call the method with test parameters
      const params: CreateVaultParams = {
        name: 'New Test Vault',
        description: 'A test vault for unit tests',
        encrypted: true,
        encryptionKey: 'secureEncryptionKey123',
        tags: ['test', 'development']
      };

      const result = await vaultClient.createVault(params);

      // Verify the correct API endpoint was called
      expect(mockApiClient.post).toHaveBeenCalledWith('/vaults', expect.objectContaining({
        name: 'New Test Vault',
        description: 'A test vault for unit tests',
        encrypted: true,
        encryptionKey: 'secureEncryptionKey123',
        tags: ['test', 'development']
      }));

      // Verify the response is correct
      expect(result).toEqual(mockResponse);
    });

    it('should handle minimal parameters', async () => {
      // Mock the API response
      mockApiClient.post.mockResolvedValue({ 
        success: true, 
        data: { vault: { id: 'vault-123', name: 'Simple Vault', status: 'active' as const, ownerId: 'user-1', createdAt: '2025-04-01T12:00:00Z', updatedAt: '2025-04-01T12:00:00Z' } }
      });

      // Call with only required parameters
      await vaultClient.createVault({ name: 'Simple Vault' });

      // Should call API with just the name
      expect(mockApiClient.post).toHaveBeenCalledWith('/vaults', expect.objectContaining({
        name: 'Simple Vault'
      }));
    });
  });

  describe('updateVault', () => {
    it('should call the API with correct parameters', async () => {
      // Mock the API response
      const mockResponse = {
        success: true,
        data: {
          vault: { 
            id: 'vault-123', 
            name: 'Updated Vault Name', 
            description: 'Updated description',
            ownerId: 'user-1',
            createdAt: '2025-04-01T12:00:00Z',
            updatedAt: '2025-04-05T14:30:00Z',
            status: 'active' as const,
            tags: ['updated', 'modified']
          }
        }
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      // Call the method with test parameters
      const params: UpdateVaultParams = {
        id: 'vault-123',
        name: 'Updated Vault Name',
        description: 'Updated description',
        tags: ['updated', 'modified']
      };

      const result = await vaultClient.updateVault(params);

      // Verify the correct API endpoint was called
      expect(mockApiClient.put).toHaveBeenCalledWith('/vaults/vault-123', expect.objectContaining({
        name: 'Updated Vault Name',
        description: 'Updated description',
        tags: ['updated', 'modified']
      }));

      // Verify id is not in the request body
      expect(mockApiClient.put.mock.calls[0][1]).not.toHaveProperty('id');

      // Verify the response is correct
      expect(result).toEqual(mockResponse);
    });

    it('should support status changes', async () => {
      mockApiClient.put.mockResolvedValue({ 
        success: true, 
        data: { vault: { id: 'vault-123', status: 'archived' as const, name: 'Archived Vault', ownerId: 'user-1', createdAt: '2025-04-01T12:00:00Z', updatedAt: '2025-04-05T14:30:00Z' } }
      });

      // Call with status change
      await vaultClient.updateVault({
        id: 'vault-123',
        status: 'archived'
      });

      // Should call API with status in the request body
      expect(mockApiClient.put).toHaveBeenCalledWith('/vaults/vault-123', expect.objectContaining({
        status: 'archived'
      }));
    });
  });

  describe('deleteVault', () => {
    it('should call the API with correct parameters', async () => {
      // Mock the API response
      const mockResponse = {
        success: true,
        data: {
          id: 'vault-123',
          deleted: true
        }
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      // Call the method with test parameters
      const params: DeleteVaultParams = {
        id: 'vault-123',
        permanent: true
      };

      const result = await vaultClient.deleteVault(params);

      // Verify the correct API endpoint was called
      expect(mockApiClient.delete).toHaveBeenCalledWith('/vaults/vault-123?permanent=true');
      
      // Verify the response is correct
      expect(result).toEqual(mockResponse);
    });

    it('should support soft delete by default', async () => {
      mockApiClient.delete.mockResolvedValue({ 
        success: true, 
        data: { id: 'vault-123', deleted: true }
      });

      // Call without permanent flag
      await vaultClient.deleteVault({
        id: 'vault-123'
      });

      // Should call API without permanent flag in query
      expect(mockApiClient.delete).toHaveBeenCalledWith('/vaults/vault-123');
    });
  });
});

describe('Vault Modification Tools', () => {
  let mockServer: TuskyMcpServer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = new TuskyMcpServer();
  });

  describe('create-vault tool', () => {
    it('should be registered with the server', () => {
      // Check if the tool was registered
      const tools = (mockServer as any).tuskyTools;
      const createVaultTool = tools.find((tool: any) => tool.name === 'create-vault');
      
      expect(createVaultTool).toBeDefined();
      expect(createVaultTool.description).toContain('Create a new vault');
    });
  });

  describe('update-vault tool', () => {
    it('should be registered with the server', () => {
      // Check if the tool was registered
      const tools = (mockServer as any).tuskyTools;
      const updateVaultTool = tools.find((tool: any) => tool.name === 'update-vault');
      
      expect(updateVaultTool).toBeDefined();
      expect(updateVaultTool.description).toContain('Update an existing vault');
    });
  });

  describe('delete-vault tool', () => {
    it('should be registered with the server', () => {
      // Check if the tool was registered
      const tools = (mockServer as any).tuskyTools;
      const deleteVaultTool = tools.find((tool: any) => tool.name === 'delete-vault');
      
      expect(deleteVaultTool).toBeDefined();
      expect(deleteVaultTool.description).toContain('Delete a vault');
    });
  });
});
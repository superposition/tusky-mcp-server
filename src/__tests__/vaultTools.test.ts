// src/__tests__/vaultTools.test.ts

import { VaultClient } from '../services/vaultClient';
import { ApiClient } from '../services/apiClient';
import { ListVaultsParams, GetVaultParams, Vault } from '../types/vault';
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

describe('VaultClient', () => {
  let vaultClient: VaultClient;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    mockApiClient = new ApiClient() as jest.Mocked<ApiClient>;
    vaultClient = new VaultClient(mockApiClient);
  });

  describe('listVaults', () => {
    it('should call the API with correct parameters', async () => {
      // Mock the API response
      const mockResponse = {
        success: true,
        data: {
          vaults: [
            { 
              id: 'vault-123', 
              name: 'Test Vault', 
              ownerId: 'user-1',
              createdAt: '2025-04-01T12:00:00Z',
              updatedAt: '2025-04-05T14:30:00Z',
              status: 'active' as const,
              size: 1024,
              itemCount: 5
            }
          ],
          nextToken: 'next-token-123',
          totalCount: 1
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // Call the method with test parameters
      const params: ListVaultsParams = {
        status: 'active',
        limit: 10,
        ownedOnly: true,
        tags: ['important', 'work']
      };

      const result = await vaultClient.listVaults(params);

      // Verify the correct API endpoint was called
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/vaults'));
      
      // Verify query parameters were correctly added
      const callArg = mockApiClient.get.mock.calls[0][0];
      expect(callArg).toContain('status=active');
      expect(callArg).toContain('limit=10');
      expect(callArg).toContain('ownedOnly=true');
      expect(callArg).toContain('tags=important');
      expect(callArg).toContain('tags=work');

      // Verify the response is correct
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty parameters', async () => {
      // Mock the API response
      mockApiClient.get.mockResolvedValue({ success: true, data: { vaults: [] } });

      // Call without parameters
      await vaultClient.listVaults();

      // Should call API with just the base endpoint
      expect(mockApiClient.get).toHaveBeenCalledWith('/vaults');
    });
  });

  describe('getVault', () => {
    it('should call the API with the correct vault ID', async () => {
      // Mock the API response
      const mockVault: Vault = {
        id: 'vault-123',
        name: 'Test Vault',
        description: 'A test vault',
        ownerId: 'user-1',
        createdAt: '2025-04-01T12:00:00Z',
        updatedAt: '2025-04-05T14:30:00Z',
        status: 'active',
        size: 1024,
        itemCount: 5
      };

      const mockResponse = {
        success: true,
        data: {
          vault: mockVault
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // Call the method with a specific vault ID
      const params: GetVaultParams = {
        id: 'vault-123',
        includePermissions: true
      };

      const result = await vaultClient.getVault(params);

      // Verify the correct API endpoint was called
      expect(mockApiClient.get).toHaveBeenCalledWith('/vaults/vault-123?includePermissions=true');
      
      // Verify the response is correct
      expect(result).toEqual(mockResponse);
    });

    it('should include optional parameters when provided', async () => {
      mockApiClient.get.mockResolvedValue({ success: true, data: { vault: {} } });

      // Call with all optional parameters
      await vaultClient.getVault({
        id: 'vault-123',
        includePermissions: true,
        includeFiles: true,
        includeFolders: true
      });

      // Verify query parameters
      const callArg = mockApiClient.get.mock.calls[0][0];
      expect(callArg).toContain('includePermissions=true');
      expect(callArg).toContain('includeFiles=true');
      expect(callArg).toContain('includeFolders=true');
    });
  });

  describe('vaultExists', () => {
    it('should return true when vault exists', async () => {
      // Mock successful response
      mockApiClient.get.mockResolvedValue({ success: true, data: { vault: {} } });

      const result = await vaultClient.vaultExists('vault-123');
      
      expect(result).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/vaults/vault-123');
    });

    it('should return false when vault does not exist', async () => {
      // Mock 404 error
      const notFoundError = new Error('Not found');
      (notFoundError as any).response = { status: 404 };
      mockApiClient.get.mockRejectedValue(notFoundError);

      const result = await vaultClient.vaultExists('non-existent-vault');
      
      expect(result).toBe(false);
    });

    it('should rethrow other errors', async () => {
      // Mock a different error
      const serverError = new Error('Server error');
      (serverError as any).response = { status: 500 };
      mockApiClient.get.mockRejectedValue(serverError);

      await expect(vaultClient.vaultExists('vault-123')).rejects.toThrow('Server error');
    });
  });
});

describe('Vault Tools', () => {
  let mockServer: TuskyMcpServer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = new TuskyMcpServer();
  });

  describe('list-vaults tool', () => {
    it('should be registered with the server', () => {
      // Check if the tool was registered
      const tools = (mockServer as any).tuskyTools;
      const listVaultsTool = tools.find((tool: any) => tool.name === 'list-vaults');
      
      expect(listVaultsTool).toBeDefined();
      expect(listVaultsTool.description).toContain('List vaults');
    });
  });

  describe('get-vault tool', () => {
    it('should be registered with the server', () => {
      // Check if the tool was registered
      const tools = (mockServer as any).tuskyTools;
      const getVaultTool = tools.find((tool: any) => tool.name === 'get-vault');
      
      expect(getVaultTool).toBeDefined();
      expect(getVaultTool.description).toContain('Get detailed information');
    });
  });
});
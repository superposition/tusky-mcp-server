// src/tools/vaults.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { ListVaultsParams, GetVaultParams } from '../types/vault';

/**
 * Zod schema for list-vaults tool parameters
 */
const ListVaultsSchema = z.object({
  status: z.enum(['active', 'archived', 'deleted', 'all']).optional().default('active'),
  limit: z.number().int().positive().max(100).optional(),
  nextToken: z.string().optional(),
  ownedOnly: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Zod schema for get-vault tool parameters
 */
const GetVaultSchema = z.object({
  id: z.string().min(1),
  includePermissions: z.boolean().optional().default(false),
  includeFiles: z.boolean().optional().default(false),
  includeFolders: z.boolean().optional().default(false),
});

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Register vault tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerVaultTools(server: TuskyMcpServer): void {
  /**
   * Tool: list-vaults
   * Lists vaults accessible to the current user
   */
  server.registerTool({
    name: 'list-vaults',
    description: 'List vaults accessible to the current user',
    schema: ListVaultsSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to list vaults. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = ListVaultsSchema.parse(params) as ListVaultsParams;
        
        // Call API to get vaults
        const vaultClient = tuskyMcpServer.getVaultClient();
        const response = await vaultClient.listVaults(validatedParams);
        
        if (!response.success || !response.data?.vaults) {
          return {
            success: false,
            error: response.error || 'Failed to list vaults',
            message: response.message || 'An error occurred while fetching vaults.'
          };
        }

        // Format the response for better readability
        const formattedVaults = response.data.vaults.map(vault => ({
          id: vault.id,
          name: vault.name,
          description: vault.description,
          status: vault.status,
          owner: vault.ownerName || vault.ownerId,
          created: formatDate(vault.createdAt),
          size: formatFileSize(vault.size),
          itemCount: vault.itemCount || 0,
          tags: vault.tags?.join(', ') || ''
        }));

        // Return the formatted response
        return {
          success: true,
          data: {
            vaults: formattedVaults,
            nextToken: response.data.nextToken,
            totalCount: response.data.totalCount
          }
        };
      } catch (error) {
        console.error('Error in list-vaults tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while listing vaults.'
        };
      }
    }
  });

  /**
   * Tool: get-vault
   * Get detailed information about a specific vault
   */
  server.registerTool({
    name: 'get-vault',
    description: 'Get detailed information about a specific vault',
    schema: GetVaultSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to retrieve vault details. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = GetVaultSchema.parse(params) as GetVaultParams;
        
        // Call API to get vault details
        const vaultClient = tuskyMcpServer.getVaultClient();
        const response = await vaultClient.getVault(validatedParams);
        
        if (!response.success || !response.data?.vault) {
          return {
            success: false,
            error: response.error || 'Failed to retrieve vault',
            message: response.message || 'An error occurred while fetching vault details.'
          };
        }

        // Format the vault for better readability
        const vault = response.data.vault;
        const formattedVault = {
          id: vault.id,
          name: vault.name,
          description: vault.description || 'No description',
          status: vault.status,
          owner: vault.ownerName || vault.ownerId,
          created: formatDate(vault.createdAt),
          updated: formatDate(vault.updatedAt),
          size: formatFileSize(vault.size),
          itemCount: vault.itemCount || 0,
          tags: vault.tags?.join(', ') || 'No tags'
        };

        // Format permissions if included
        let formattedPermissions;
        if (validatedParams.includePermissions && response.data.permissions) {
          formattedPermissions = response.data.permissions.map(perm => ({
            user: perm.userName || perm.userId,
            access: perm.access,
            grantedAt: formatDate(perm.grantedAt),
            grantedBy: perm.grantedBy
          }));
        }

        // Format files if included
        let formattedFiles;
        if (validatedParams.includeFiles && response.data.files) {
          formattedFiles = response.data.files.map(file => ({
            id: file.id,
            name: file.name,
            type: file.type,
            size: formatFileSize(file.size),
            created: formatDate(file.createdAt),
            updated: formatDate(file.updatedAt),
            folder: file.folderId || 'Root'
          }));
        }

        // Format folders if included
        let formattedFolders;
        if (validatedParams.includeFolders && response.data.folders) {
          formattedFolders = response.data.folders.map(folder => ({
            id: folder.id,
            name: folder.name,
            parent: folder.parentId || 'Root',
            created: formatDate(folder.createdAt),
            updated: formatDate(folder.updatedAt),
            itemCount: folder.itemCount || 0
          }));
        }

        // Return the formatted response
        return {
          success: true,
          data: {
            vault: formattedVault,
            permissions: formattedPermissions,
            files: formattedFiles,
            folders: formattedFolders
          }
        };
      } catch (error) {
        console.error('Error in get-vault tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while retrieving vault details.'
        };
      }
    }
  });
}
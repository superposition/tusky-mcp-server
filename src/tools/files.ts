// src/tools/files.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { 
  ListFilesParams, 
  GetFileParams
} from '../types/file';

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
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Zod schema for list-files tool parameters
 */
const ListFilesSchema = z.object({
  vaultId: z.string().min(1, "Vault ID is required"),
  parentId: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted', 'all']).optional().default('active'),
  limit: z.number().int().positive().max(100).optional(),
  nextToken: z.string().optional(),
});

/**
 * Zod schema for get-file tool parameters
 */
const GetFileSchema = z.object({
  id: z.string().min(1, "File ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  includeMetadata: z.boolean().optional().default(false),
});

/**
 * Register file tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerFileTools(server: TuskyMcpServer): void {
  /**
   * Tool: list-files
   * Lists files in a vault or folder
   */
  server.registerTool({
    name: 'list-files',
    description: 'List files in a vault or folder',
    schema: ListFilesSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to list files. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = ListFilesSchema.parse(params) as ListFilesParams;
        
        // Call API to get files
        const vaultClient = tuskyMcpServer.getVaultClient();
        const fileClient = vaultClient.files;
        const response = await fileClient.listFiles(validatedParams);
        
        if (!response.success || !response.data?.files) {
          return {
            success: false,
            error: response.error || 'Failed to list files',
            message: response.message || 'An error occurred while fetching files.'
          };
        }

        // Format the response for better readability
        const formattedFiles = response.data.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          contentType: file.contentType || 'Unknown',
          size: formatFileSize(file.size),
          folderId: file.folderId || 'Root',
          status: file.status,
          created: formatDate(file.createdAt),
          updated: formatDate(file.updatedAt)
        }));

        // Return the formatted response
        return {
          success: true,
          data: {
            files: formattedFiles,
            nextToken: response.data.nextToken,
            totalCount: response.data.totalCount
          }
        };
      } catch (error) {
        console.error('Error in list-files tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while listing files.'
        };
      }
    }
  });

  /**
   * Tool: get-file
   * Get detailed information about a specific file
   */
  server.registerTool({
    name: 'get-file',
    description: 'Get detailed information about a specific file',
    schema: GetFileSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to retrieve file details. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = GetFileSchema.parse(params) as GetFileParams;
        
        // Call API to get file details
        const vaultClient = tuskyMcpServer.getVaultClient();
        const fileClient = vaultClient.files;
        const response = await fileClient.getFile(validatedParams);
        
        if (!response.success || !response.data?.file) {
          return {
            success: false,
            error: response.error || 'Failed to retrieve file',
            message: response.message || 'An error occurred while fetching file details.'
          };
        }

        // Format the file for better readability
        const file = response.data.file;
        const formattedFile = {
          id: file.id,
          name: file.name,
          description: file.description || 'No description',
          vaultId: file.vaultId,
          folderId: file.folderId || 'Root',
          type: file.type,
          contentType: file.contentType || 'Unknown',
          size: formatFileSize(file.size),
          status: file.status,
          created: formatDate(file.createdAt),
          updated: formatDate(file.updatedAt),
          path: file.path || [],
          downloadUrl: file.downloadUrl || null,
          thumbnailUrl: file.thumbnailUrl || null,
          version: file.version || '1'
        };

        // Format metadata if included
        let formattedMetadata = null;
        if (validatedParams.includeMetadata && response.data.metadata) {
          formattedMetadata = response.data.metadata;
        }

        // Return the formatted response
        return {
          success: true,
          data: {
            file: formattedFile,
            metadata: formattedMetadata
          }
        };
      } catch (error) {
        console.error('Error in get-file tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while retrieving file details.'
        };
      }
    }
  });
}
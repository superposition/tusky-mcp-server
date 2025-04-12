// src/tools/files.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { 
  ListFilesParams, 
  GetFileParams,
  UpdateFileParams,
  DeleteFileParams
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
 * Zod schema for update-file tool parameters
 */
const UpdateFileSchema = z.object({
  id: z.string().min(1, "File ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  name: z.string().max(255, "File name must be less than 255 characters").optional(),
  folderId: z.string().optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

/**
 * Zod schema for delete-file tool parameters
 */
const DeleteFileSchema = z.object({
  id: z.string().min(1, "File ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  permanent: z.boolean().optional().default(false)
    .refine(val => {
      // Add a validation warning for permanent deletion
      if (val === true) {
        // We can't throw an error here because it would prevent valid operations
        // Instead, we'll show a warning in the tool execution
        console.warn("WARNING: Permanent deletion cannot be undone!");
      }
      return true;
    })
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

  /**
   * Tool: update-file
   * Update a file's properties (name, folder, status)
   */
  server.registerTool({
    name: 'update-file',
    description: 'Update a file (rename, move to another folder, change status)',
    schema: UpdateFileSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to update a file. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = UpdateFileSchema.parse(params) as UpdateFileParams;
        
        // Check if file exists before attempting to update
        const vaultClient = tuskyMcpServer.getVaultClient();
        const fileClient = vaultClient.files;
        const fileExists = await fileClient.fileExists(validatedParams.id, validatedParams.vaultId);
        
        if (!fileExists) {
          return {
            success: false,
            error: 'Not found',
            message: `File with ID "${validatedParams.id}" does not exist or you don't have access to it.`
          };
        }

        // Call API to update file
        const response = await fileClient.updateFile(validatedParams);
        
        if (!response.success || !response.data?.file) {
          return {
            success: false,
            error: response.error || 'Failed to update file',
            message: response.message || 'An error occurred while updating the file.'
          };
        }

        // Format the response for better readability
        const file = response.data.file;
        const formattedResponse = {
          success: true,
          message: `File "${file.name}" updated successfully.`,
          data: {
            id: file.id,
            name: file.name,
            description: file.description || '',
            vaultId: file.vaultId,
            folderId: file.folderId || 'Root',
            status: file.status,
            size: formatFileSize(file.size),
            updated: formatDate(file.updatedAt)
          }
        };

        // Special message for status changes
        if (validatedParams.status === 'archived') {
          formattedResponse.message = `File "${file.name}" archived successfully.`;
        } else if (validatedParams.status === 'deleted') {
          formattedResponse.message = `File "${file.name}" moved to trash successfully.`;
        } else if (validatedParams.name) {
          formattedResponse.message = `File renamed to "${file.name}" successfully.`;
        } else if (validatedParams.folderId) {
          formattedResponse.message = `File "${file.name}" moved to a different folder successfully.`;
        }

        return formattedResponse;
      } catch (error) {
        console.error('Error in update-file tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while updating the file.'
        };
      }
    }
  });

  /**
   * Tool: delete-file
   * Deletes a file permanently
   */
  server.registerTool({
    name: 'delete-file',
    description: 'Delete a file from Tusky',
    schema: DeleteFileSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to delete a file. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = DeleteFileSchema.parse(params) as DeleteFileParams;
        
        // Check if file exists before attempting to delete
        const vaultClient = tuskyMcpServer.getVaultClient();
        const fileClient = vaultClient.files;
        const fileExists = await fileClient.fileExists(validatedParams.id, validatedParams.vaultId);
        
        if (!fileExists) {
          return {
            success: false,
            error: 'Not found',
            message: `File with ID "${validatedParams.id}" does not exist or you don't have access to it.`
          };
        }

        // Add extra warning for permanent deletion
        if (validatedParams.permanent) {
          // Get file info to include in warning
          const fileInfo = await fileClient.getFile({ 
            id: validatedParams.id, 
            vaultId: validatedParams.vaultId 
          });
          const fileName = fileInfo.data?.file.name || validatedParams.id;
          
          // Check for confirmation parameter (handled separately from schema)
          if (!params['confirmed']) {
            return {
              success: false,
              error: 'Confirmation required',
              message: `WARNING: You are about to permanently delete file "${fileName}". This action cannot be undone. To confirm, call delete-file again with the same parameters and add "confirmed: true".`,
              data: {
                id: validatedParams.id,
                requiresConfirmation: true
              }
            };
          }
        }

        // Call API to delete file
        const response = await fileClient.deleteFile(validatedParams);
        
        if (!response.success) {
          return {
            success: false,
            error: response.error || 'Failed to delete file',
            message: response.message || 'An error occurred while deleting the file.'
          };
        }

        // Format the response for better readability
        let message = validatedParams.permanent
          ? `File permanently deleted successfully.`
          : `File moved to trash successfully. You can restore it later if needed.`;

        return {
          success: true,
          message,
          data: {
            id: validatedParams.id,
            deleted: true,
            permanent: validatedParams.permanent || false
          }
        };
      } catch (error) {
        console.error('Error in delete-file tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while deleting the file.'
        };
      }
    }
  });
}
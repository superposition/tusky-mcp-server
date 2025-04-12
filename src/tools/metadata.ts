// src/tools/metadata.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { 
  GetFileMetadataParams, 
  UpdateFileMetadataParams,
  DeleteFileMetadataParams
} from '../types/metadata';

/**
 * Format metadata for display
 */
function formatMetadata(metadata: Record<string, any>): Record<string, any> {
  if (!metadata || Object.keys(metadata).length === 0) {
    return { message: 'No metadata found for this file.' };
  }
  return metadata;
}

/**
 * Zod schema for get-file-metadata tool parameters
 */
const GetFileMetadataSchema = z.object({
  id: z.string().min(1, "File ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  key: z.string().optional(),
});

/**
 * Zod schema for update-file-metadata tool parameters
 */
const UpdateFileMetadataSchema = z.object({
  id: z.string().min(1, "File ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  metadata: z.record(z.any()).refine(val => {
    // Ensure metadata is not empty
    return Object.keys(val).length > 0;
  }, {
    message: "Metadata object must contain at least one key-value pair"
  }),
  merge: z.boolean().optional().default(true),
});

/**
 * Zod schema for delete-file-metadata tool parameters
 */
const DeleteFileMetadataSchema = z.object({
  id: z.string().min(1, "File ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  key: z.string().optional(),
});

/**
 * Register file metadata tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerFileMetadataTools(server: TuskyMcpServer): void {
  /**
   * Tool: get-file-metadata
   * Gets metadata for a specific file
   */
  server.registerTool({
    name: 'get-file-metadata',
    description: 'Get metadata for a specific file',
    schema: GetFileMetadataSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to retrieve file metadata. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = GetFileMetadataSchema.parse(params) as GetFileMetadataParams;
        
        // Call API to get file metadata
        const vaultClient = tuskyMcpServer.getVaultClient();
        const metadataClient = vaultClient.metadata;
        const response = await metadataClient.getFileMetadata(validatedParams);
        
        if (!response.success || !response.data?.metadata) {
          return {
            success: false,
            error: response.error || 'Failed to retrieve file metadata',
            message: response.message || 'An error occurred while fetching file metadata.'
          };
        }

        // Format the metadata for better readability
        const formattedMetadata = formatMetadata(response.data.metadata);

        // Return the formatted response
        return {
          success: true,
          data: {
            metadata: formattedMetadata
          }
        };
      } catch (error) {
        console.error('Error in get-file-metadata tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while retrieving file metadata.'
        };
      }
    }
  });

  /**
   * Tool: update-file-metadata
   * Update metadata for a specific file
   */
  server.registerTool({
    name: 'update-file-metadata',
    description: 'Update or add metadata for a specific file',
    schema: UpdateFileMetadataSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to update file metadata. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = UpdateFileMetadataSchema.parse(params) as UpdateFileMetadataParams;
        
        // Check if file exists before attempting to update metadata
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

        // Call API to update file metadata
        const metadataClient = vaultClient.metadata;
        const response = await metadataClient.updateFileMetadata(validatedParams);
        
        if (!response.success || !response.data?.metadata) {
          return {
            success: false,
            error: response.error || 'Failed to update file metadata',
            message: response.message || 'An error occurred while updating file metadata.'
          };
        }

        // Format the metadata for better readability
        const formattedMetadata = formatMetadata(response.data.metadata);

        // Return the formatted response
        const mergeMode = validatedParams.merge ? 'merged with' : 'replaced';
        return {
          success: true,
          message: `File metadata ${mergeMode} existing metadata successfully.`,
          data: {
            metadata: formattedMetadata
          }
        };
      } catch (error) {
        console.error('Error in update-file-metadata tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while updating file metadata.'
        };
      }
    }
  });

  /**
   * Tool: delete-file-metadata
   * Delete metadata for a specific file
   */
  server.registerTool({
    name: 'delete-file-metadata',
    description: 'Delete all metadata or a specific metadata key for a file',
    schema: DeleteFileMetadataSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to delete file metadata. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = DeleteFileMetadataSchema.parse(params) as DeleteFileMetadataParams;
        
        // Check if file exists before attempting to delete metadata
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

        // Add confirmation check for deleting all metadata
        if (!validatedParams.key && !params['confirmed']) {
          return {
            success: false,
            error: 'Confirmation required',
            message: `You are about to delete ALL metadata for this file. This action cannot be undone. To confirm, call delete-file-metadata again with the same parameters and add "confirmed: true".`,
            data: {
              id: validatedParams.id,
              requiresConfirmation: true
            }
          };
        }

        // Call API to delete file metadata
        const metadataClient = vaultClient.metadata;
        const response = await metadataClient.deleteFileMetadata(validatedParams);
        
        if (!response.success) {
          return {
            success: false,
            error: response.error || 'Failed to delete file metadata',
            message: response.message || 'An error occurred while deleting file metadata.'
          };
        }

        // Format the response message
        let message = validatedParams.key 
          ? `Metadata key "${validatedParams.key}" deleted successfully.`
          : `All metadata for the file deleted successfully.`;

        // Return the formatted response
        return {
          success: true,
          message,
          data: {
            id: validatedParams.id,
            deletedKeys: response.data?.deletedKeys || []
          }
        };
      } catch (error) {
        console.error('Error in delete-file-metadata tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while deleting file metadata.'
        };
      }
    }
  });
}

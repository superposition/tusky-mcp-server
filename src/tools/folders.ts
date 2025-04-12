// src/tools/folders.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { 
  ListFoldersParams, 
  GetFolderParams,
  CreateFolderParams,
  UpdateFolderParams,
  DeleteFolderParams
} from '../types/folder';

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
 * Zod schema for list-folders tool parameters
 */
const ListFoldersSchema = z.object({
  vaultId: z.string().min(1, "Vault ID is required"),
  parentId: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted', 'all']).optional().default('active'),
  limit: z.number().int().positive().max(100).optional(),
  nextToken: z.string().optional(),
});

/**
 * Zod schema for get-folder tool parameters
 */
const GetFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  includeItems: z.boolean().optional().default(false),
});

/**
 * Zod schema for create-folder tool parameters
 */
const CreateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Folder name must be less than 255 characters"),
  vaultId: z.string().min(1, "Vault ID is required"),
  parentId: z.string().optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
});

/**
 * Zod schema for update-folder tool parameters
 */
const UpdateFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  vaultId: z.string().min(1, "Vault ID is required"),
  name: z.string().max(255, "Folder name must be less than 255 characters").optional(),
  parentId: z.string().optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

/**
 * Zod schema for delete-folder tool parameters
 */
const DeleteFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
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
 * Register folder tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerFolderTools(server: TuskyMcpServer): void {
  /**
   * Tool: list-folders
   * Lists folders in a vault
   */
  server.registerTool({
    name: 'list-folders',
    description: 'List folders in a vault',
    schema: ListFoldersSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to list folders. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = ListFoldersSchema.parse(params) as ListFoldersParams;
        
        // Call API to get folders
        const vaultClient = tuskyMcpServer.getVaultClient();
        const response = await vaultClient.folders.listFolders(validatedParams);
        
        if (!response.success || !response.data?.folders) {
          return {
            success: false,
            error: response.error || 'Failed to list folders',
            message: response.message || 'An error occurred while fetching folders.'
          };
        }

        // Format the response for better readability
        const formattedFolders = response.data.folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId || 'Root',
          status: folder.status,
          created: formatDate(folder.createdAt),
          updated: formatDate(folder.updatedAt),
          itemCount: folder.itemCount || 0
        }));

        // Return the formatted response
        return {
          success: true,
          data: {
            folders: formattedFolders,
            nextToken: response.data.nextToken,
            totalCount: response.data.totalCount
          }
        };
      } catch (error) {
        console.error('Error in list-folders tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while listing folders.'
        };
      }
    }
  });

  /**
   * Tool: get-folder
   * Get detailed information about a specific folder
   */
  server.registerTool({
    name: 'get-folder',
    description: 'Get detailed information about a specific folder',
    schema: GetFolderSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to retrieve folder details. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = GetFolderSchema.parse(params) as GetFolderParams;
        
        // Call API to get folder details
        const vaultClient = tuskyMcpServer.getVaultClient();
        const response = await vaultClient.folders.getFolder(validatedParams);
        
        if (!response.success || !response.data?.folder) {
          return {
            success: false,
            error: response.error || 'Failed to retrieve folder',
            message: response.message || 'An error occurred while fetching folder details.'
          };
        }

        // Format the folder for better readability
        const folder = response.data.folder;
        const formattedFolder = {
          id: folder.id,
          name: folder.name,
          description: folder.description || 'No description',
          vaultId: folder.vaultId,
          parentId: folder.parentId || 'Root',
          status: folder.status,
          created: formatDate(folder.createdAt),
          updated: formatDate(folder.updatedAt),
          itemCount: folder.itemCount || 0,
          path: folder.path || []
        };

        // Format items if included
        let formattedItems = null;
        if (validatedParams.includeItems && response.data.items) {
          formattedItems = {
            files: response.data.items.files?.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: file.size,
              created: formatDate(file.createdAt),
              updated: formatDate(file.updatedAt),
              status: file.status
            })),
            folders: response.data.items.folders?.map(subfolder => ({
              id: subfolder.id,
              name: subfolder.name,
              itemCount: subfolder.itemCount || 0,
              created: formatDate(subfolder.createdAt),
              updated: formatDate(subfolder.updatedAt),
              status: subfolder.status
            }))
          };
        }

        // Return the formatted response
        return {
          success: true,
          data: {
            folder: formattedFolder,
            items: formattedItems
          }
        };
      } catch (error) {
        console.error('Error in get-folder tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while retrieving folder details.'
        };
      }
    }
  });
}

/**
 * Register folder creation and modification tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerFolderModificationTools(server: TuskyMcpServer): void {
  /**
   * Tool: create-folder
   * Creates a new folder with the specified parameters
   */
  server.registerTool({
    name: 'create-folder',
    description: 'Create a new folder in Tusky',
    schema: CreateFolderSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to create a folder. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = CreateFolderSchema.parse(params) as CreateFolderParams;
        
        // Call API to create folder
        const vaultClient = tuskyMcpServer.getVaultClient();
        const response = await vaultClient.folders.createFolder(validatedParams);
        
        if (!response.success || !response.data?.folder) {
          return {
            success: false,
            error: response.error || 'Failed to create folder',
            message: response.message || 'An error occurred while creating the folder.'
          };
        }

        // Format the response for better readability
        const folder = response.data.folder;
        const formattedResponse = {
          success: true,
          message: `Folder "${folder.name}" created successfully.`,
          data: {
            id: folder.id,
            name: folder.name,
            description: folder.description || '',
            vaultId: folder.vaultId,
            parentId: folder.parentId || 'Root',
            created: new Date(folder.createdAt).toLocaleString()
          }
        };

        return formattedResponse;
      } catch (error) {
        console.error('Error in create-folder tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while creating the folder.'
        };
      }
    }
  });

  /**
   * Tool: update-folder
   * Updates an existing folder with the specified parameters
   */
  server.registerTool({
    name: 'update-folder',
    description: 'Update an existing folder in Tusky',
    schema: UpdateFolderSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to update a folder. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = UpdateFolderSchema.parse(params) as UpdateFolderParams;
        
        // Check if folder exists before attempting to update
        const vaultClient = tuskyMcpServer.getVaultClient();
        const folderExists = await vaultClient.folders.folderExists(validatedParams.id, validatedParams.vaultId);
        
        if (!folderExists) {
          return {
            success: false,
            error: 'Not found',
            message: `Folder with ID "${validatedParams.id}" does not exist or you don't have access to it.`
          };
        }

        // Call API to update folder
        const response = await vaultClient.folders.updateFolder(validatedParams);
        
        if (!response.success || !response.data?.folder) {
          return {
            success: false,
            error: response.error || 'Failed to update folder',
            message: response.message || 'An error occurred while updating the folder.'
          };
        }

        // Format the response for better readability
        const folder = response.data.folder;
        const formattedResponse = {
          success: true,
          message: `Folder "${folder.name}" updated successfully.`,
          data: {
            id: folder.id,
            name: folder.name,
            description: folder.description || '',
            vaultId: folder.vaultId,
            parentId: folder.parentId || 'Root',
            status: folder.status,
            updated: new Date(folder.updatedAt).toLocaleString()
          }
        };

        // Special message for status changes
        if (validatedParams.status === 'archived') {
          formattedResponse.message = `Folder "${folder.name}" archived successfully.`;
        } else if (validatedParams.status === 'deleted') {
          formattedResponse.message = `Folder "${folder.name}" moved to trash successfully.`;
        }

        return formattedResponse;
      } catch (error) {
        console.error('Error in update-folder tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while updating the folder.'
        };
      }
    }
  });

  /**
   * Tool: delete-folder
   * Deletes a folder permanently
   */
  server.registerTool({
    name: 'delete-folder',
    description: 'Delete a folder from Tusky',
    schema: DeleteFolderSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to delete a folder. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = DeleteFolderSchema.parse(params) as DeleteFolderParams;
        
        // Check if folder exists before attempting to delete
        const vaultClient = tuskyMcpServer.getVaultClient();
        const folderExists = await vaultClient.folders.folderExists(validatedParams.id, validatedParams.vaultId);
        
        if (!folderExists) {
          return {
            success: false,
            error: 'Not found',
            message: `Folder with ID "${validatedParams.id}" does not exist or you don't have access to it.`
          };
        }

        // Add extra warning for permanent deletion
        if (validatedParams.permanent) {
          // Get folder info to include in warning
          const folderInfo = await vaultClient.folders.getFolder({ 
            id: validatedParams.id, 
            vaultId: validatedParams.vaultId 
          });
          const folderName = folderInfo.data?.folder.name || validatedParams.id;
          
          return {
            success: false, // Not actually an error, but we want to force confirmation
            error: 'Confirmation required',
            message: `WARNING: You are about to permanently delete folder "${folderName}". This action cannot be undone. To confirm, call delete-folder again with the same parameters and add "confirmed: true".`,
            data: {
              id: validatedParams.id,
              requiresConfirmation: true
            }
          };
        }

        // Check for confirmation parameter (handled separately from schema)
        if (validatedParams.permanent && !params['confirmed']) {
          return {
            success: false,
            error: 'Confirmation required',
            message: 'Permanent deletion requires confirmation. Please add "confirmed: true" to the parameters.'
          };
        }

        // Call API to delete folder
        const response = await vaultClient.folders.deleteFolder(validatedParams);
        
        if (!response.success) {
          return {
            success: false,
            error: response.error || 'Failed to delete folder',
            message: response.message || 'An error occurred while deleting the folder.'
          };
        }

        // Format the response for better readability
        let message = validatedParams.permanent
          ? `Folder permanently deleted successfully.`
          : `Folder moved to trash successfully. You can restore it later if needed.`;

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
        console.error('Error in delete-folder tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while deleting the folder.'
        };
      }
    }
  });
}

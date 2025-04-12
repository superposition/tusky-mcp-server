// src/tools/vaultModification.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { 
  CreateVaultParams, 
  UpdateVaultParams, 
  DeleteVaultParams 
} from '../types/vault';

/**
 * Zod schema for create-vault tool parameters
 */
const CreateVaultSchema = z.object({
  name: z.string().min(1, "Vault name is required").max(100, "Vault name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  tags: z.array(z.string()).optional(),
  encrypted: z.boolean().optional().default(false),
  encryptionKey: z.string().optional()
    .refine(val => {
      // If encryption key is provided, it must meet certain requirements
      if (val) {
        return val.length >= 16; // Minimum key length
      }
      return true;
    }, "Encryption key must be at least 16 characters long")
});

/**
 * Zod schema for update-vault tool parameters
 */
const UpdateVaultSchema = z.object({
  id: z.string().min(1, "Vault ID is required"),
  name: z.string().max(100, "Vault name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional()
});

/**
 * Zod schema for delete-vault tool parameters
 */
const DeleteVaultSchema = z.object({
  id: z.string().min(1, "Vault ID is required"),
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
 * Register vault creation and modification tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerVaultModificationTools(server: TuskyMcpServer): void {
  /**
   * Tool: create-vault
   * Creates a new vault with the specified parameters
   */
  server.registerTool({
    name: 'create-vault',
    description: 'Create a new vault in Tusky',
    schema: CreateVaultSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to create a vault. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = CreateVaultSchema.parse(params) as CreateVaultParams;
        
        // Check if encryption key is provided when encryption is enabled
        if (validatedParams.encrypted && !validatedParams.encryptionKey) {
          return {
            success: false,
            error: 'Validation error',
            message: 'An encryption key is required when creating an encrypted vault.'
          };
        }

        // Call API to create vault
        const vaultClient = tuskyMcpServer.getVaultClient();
        const response = await vaultClient.createVault(validatedParams);
        
        if (!response.success || !response.data?.vault) {
          return {
            success: false,
            error: response.error || 'Failed to create vault',
            message: response.message || 'An error occurred while creating the vault.'
          };
        }

        // Format the response for better readability
        const vault = response.data.vault;
        const formattedResponse = {
          success: true,
          message: `Vault "${vault.name}" created successfully.`,
          data: {
            id: vault.id,
            name: vault.name,
            description: vault.description || '',
            status: vault.status,
            owner: vault.ownerName || vault.ownerId,
            created: new Date(vault.createdAt).toLocaleString(),
            encrypted: vault.isEncrypted || false,
            tags: vault.tags || []
          }
        };

        return formattedResponse;
      } catch (error) {
        console.error('Error in create-vault tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while creating the vault.'
        };
      }
    }
  });

  /**
   * Tool: update-vault
   * Updates an existing vault with the specified parameters
   */
  server.registerTool({
    name: 'update-vault',
    description: 'Update an existing vault in Tusky',
    schema: UpdateVaultSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to update a vault. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = UpdateVaultSchema.parse(params) as UpdateVaultParams;
        
        // Check if vault exists before attempting to update
        const vaultClient = tuskyMcpServer.getVaultClient();
        const vaultExists = await vaultClient.vaultExists(validatedParams.id);
        
        if (!vaultExists) {
          return {
            success: false,
            error: 'Not found',
            message: `Vault with ID "${validatedParams.id}" does not exist or you don't have access to it.`
          };
        }

        // Call API to update vault
        const response = await vaultClient.updateVault(validatedParams);
        
        if (!response.success || !response.data?.vault) {
          return {
            success: false,
            error: response.error || 'Failed to update vault',
            message: response.message || 'An error occurred while updating the vault.'
          };
        }

        // Format the response for better readability
        const vault = response.data.vault;
        const formattedResponse = {
          success: true,
          message: `Vault "${vault.name}" updated successfully.`,
          data: {
            id: vault.id,
            name: vault.name,
            description: vault.description || '',
            status: vault.status,
            updated: new Date(vault.updatedAt).toLocaleString(),
            tags: vault.tags || []
          }
        };

        // Special message for status changes
        if (validatedParams.status === 'archived') {
          formattedResponse.message = `Vault "${vault.name}" archived successfully.`;
        } else if (validatedParams.status === 'deleted') {
          formattedResponse.message = `Vault "${vault.name}" moved to trash successfully.`;
        }

        return formattedResponse;
      } catch (error) {
        console.error('Error in update-vault tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while updating the vault.'
        };
      }
    }
  });

  /**
   * Tool: delete-vault
   * Deletes a vault permanently
   */
  server.registerTool({
    name: 'delete-vault',
    description: 'Delete a vault from Tusky',
    schema: DeleteVaultSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to delete a vault. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = DeleteVaultSchema.parse(params) as DeleteVaultParams;
        
        // Check if vault exists before attempting to delete
        const vaultClient = tuskyMcpServer.getVaultClient();
        const vaultExists = await vaultClient.vaultExists(validatedParams.id);
        
        if (!vaultExists) {
          return {
            success: false,
            error: 'Not found',
            message: `Vault with ID "${validatedParams.id}" does not exist or you don't have access to it.`
          };
        }

        // Add extra warning for permanent deletion
        if (validatedParams.permanent) {
          // Get vault info to include in warning
          const vaultInfo = await vaultClient.getVault({ id: validatedParams.id });
          const vaultName = vaultInfo.data?.vault.name || validatedParams.id;
          
          return {
            success: false, // Not actually an error, but we want to force confirmation
            error: 'Confirmation required',
            message: `WARNING: You are about to permanently delete vault "${vaultName}". This action cannot be undone. To confirm, call delete-vault again with the same parameters and add "confirmed: true".`,
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

        // Call API to delete vault
        const response = await vaultClient.deleteVault(validatedParams);
        
        if (!response.success) {
          return {
            success: false,
            error: response.error || 'Failed to delete vault',
            message: response.message || 'An error occurred while deleting the vault.'
          };
        }

        // Format the response for better readability
        let message = validatedParams.permanent
          ? `Vault permanently deleted successfully.`
          : `Vault moved to trash successfully. You can restore it later if needed.`;

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
        console.error('Error in delete-vault tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while deleting the vault.'
        };
      }
    }
  });
}
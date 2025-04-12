// src/tools/user.ts

import { z } from 'zod';
import { TuskyMcpServer } from '../index';
import { 
  GetProfileParams,
  UpdateProfileParams 
} from '../types/user';

/**
 * Zod schema for get-profile tool parameters
 */
const GetProfileSchema = z.object({
  includeStorage: z.boolean().optional().default(false),
});

/**
 * Zod schema for update-profile tool parameters
 */
const UpdateProfileSchema = z.object({
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").optional(),
  preferences: z.record(z.any()).optional(),
});

/**
 * Register user profile tools with the Tusky MCP Server
 * @param server The server instance to register tools with
 */
export function registerUserTools(server: TuskyMcpServer): void {
  /**
   * Tool: get-profile
   * Retrieves the authenticated user's profile information
   */
  server.registerTool({
    name: 'get-profile',
    description: 'Get the authenticated user\'s profile information',
    schema: GetProfileSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to retrieve your profile. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = GetProfileSchema.parse(params) as GetProfileParams;
        
        // Call API to get user profile
        const userClient = tuskyMcpServer.getUserClient();
        const response = await userClient.getProfile(validatedParams);
        
        if (!response.success || !response.data?.profile) {
          return {
            success: false,
            error: response.error || 'Failed to retrieve profile',
            message: response.message || 'An error occurred while fetching your profile.'
          };
        }

        // Format the response for better readability
        const profile = response.data.profile;
        const formattedProfile = {
          id: profile.id,
          name: profile.name || 'Unnamed User',
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl,
          walletAddress: profile.walletAddress,
          createdAt: new Date(profile.createdAt).toLocaleString(),
          updatedAt: new Date(profile.updatedAt).toLocaleString(),
          preferences: profile.preferences || {},
        };

        // Include storage information if requested
        let storageInfo = null;
        if (validatedParams.includeStorage && response.data.storage) {
          const storage = response.data.storage;
          const usedPercentage = Math.round((storage.used / storage.total) * 100);
          
          storageInfo = {
            total: formatBytes(storage.total),
            used: formatBytes(storage.used),
            available: formatBytes(storage.total - storage.used),
            usedPercentage: `${usedPercentage}%`,
            plan: storage.plan || 'Standard',
            expiresAt: storage.expiresAt ? new Date(storage.expiresAt).toLocaleString() : 'Never'
          };
        }

        // Return the formatted response
        return {
          success: true,
          data: {
            profile: formattedProfile,
            storage: storageInfo
          }
        };
      } catch (error) {
        console.error('Error in get-profile tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while retrieving your profile.'
        };
      }
    }
  });

  /**
   * Tool: update-profile
   * Updates the authenticated user's profile information
   */
  server.registerTool({
    name: 'update-profile',
    description: 'Update the authenticated user\'s profile information',
    schema: UpdateProfileSchema,
    executor: async (params, tuskyMcpServer) => {
      try {
        // Verify authentication
        if (!tuskyMcpServer.isAuthenticated()) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'You must be authenticated to update your profile. Use the request-auth-challenge and verify-auth-challenge tools first.'
          };
        }

        // Parse and validate params
        const validatedParams = UpdateProfileSchema.parse(params) as UpdateProfileParams;
        
        // Check if any parameters were provided to update
        if (Object.keys(validatedParams).length === 0) {
          return {
            success: false,
            error: 'No parameters provided',
            message: 'Please provide at least one parameter to update (name, bio, avatarUrl, or preferences).'
          };
        }
        
        // Call API to update user profile
        const userClient = tuskyMcpServer.getUserClient();
        const response = await userClient.updateProfile(validatedParams);
        
        if (!response.success || !response.data?.profile) {
          return {
            success: false,
            error: response.error || 'Failed to update profile',
            message: response.message || 'An error occurred while updating your profile.'
          };
        }

        // Format the response for better readability
        const profile = response.data.profile;
        const formattedProfile = {
          id: profile.id,
          name: profile.name || 'Unnamed User',
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl,
          walletAddress: profile.walletAddress,
          updatedAt: new Date(profile.updatedAt).toLocaleString(),
          preferences: profile.preferences || {},
        };

        // Construct a helpful message about what was updated
        const updatedFields = Object.keys(validatedParams).map(field => {
          // Format the field name for display
          const formattedField = field.replace(/([A-Z])/g, ' $1').toLowerCase();
          return formattedField.charAt(0).toUpperCase() + formattedField.slice(1);
        });
        
        const updateMessage = updatedFields.length === 1
          ? `Your ${updatedFields[0]} was updated successfully.`
          : `Your ${updatedFields.join(', ')} were updated successfully.`;

        // Return the formatted response
        return {
          success: true,
          message: updateMessage,
          data: {
            profile: formattedProfile
          }
        };
      } catch (error) {
        console.error('Error in update-profile tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'An unknown error occurred while updating your profile.'
        };
      }
    }
  });
}

/**
 * Format bytes to a human-readable format
 * @param bytes The number of bytes to format
 * @param decimals The number of decimal places to use
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// src/clients/user.ts

import { ApiClient } from './api';
import { 
  GetProfileParams, 
  UpdateProfileParams,
  GetProfileResponseData,
  UpdateProfileResponseData
} from '../types/user';

/**
 * Client for interacting with user profile endpoints in the Tusky API
 */
export class UserClient {
  private apiClient: ApiClient;

  /**
   * Create a new UserClient instance
   * @param apiClient The ApiClient instance to use for requests
   */
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get the authenticated user's profile
   * @param params Parameters for the profile request
   * @returns The user's profile information
   */
  async getProfile(params: GetProfileParams): Promise<{
    success: boolean;
    data?: GetProfileResponseData;
    error?: string;
    message?: string;
  }> {
    try {
      // Construct query parameters based on options
      const queryParams = params.includeStorage ? '?includeStorage=true' : '';

      // Make API request to get user profile
      const response = await this.apiClient.get(`/users/profile${queryParams}`);

      // Return the response
      return {
        success: true,
        data: response as GetProfileResponseData
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while fetching the user profile'
      };
    }
  }

  /**
   * Update the authenticated user's profile
   * @param params Fields to update on the profile
   * @returns The updated user profile
   */
  async updateProfile(params: UpdateProfileParams): Promise<{
    success: boolean;
    data?: UpdateProfileResponseData;
    error?: string;
    message?: string;
  }> {
    try {
      // Make API request to update user profile
      const response = await this.apiClient.patch('/users/profile', params);

      // Return the response
      return {
        success: true,
        data: response as UpdateProfileResponseData
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while updating the user profile'
      };
    }
  }
}

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { apiClient } from "../services/apiClient";
import { GetApiKeysResponse, CreateApiKeyResponse, DeleteApiKeyResponse } from "../types/api";

/**
 * API key management tools for Tusky integration
 */

/**
 * Define the get-api-keys tool schema
 * This tool retrieves all API keys for the authenticated user
 */
export const getApiKeysToolSchema: Tool = {
  name: "get-api-keys",
  description: "Retrieve all API keys for the authenticated user",
  inputSchema: {
    type: "object",
    properties: {},
    // No parameters required for this tool
  }
};

/**
 * Define the create-api-key tool schema
 * This tool creates a new API key with an optional name and expiration
 */
export const createApiKeyToolSchema: Tool = {
  name: "create-api-key",
  description: "Create a new Tusky API key for the authenticated user",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Display name for the API key",
      },
      expiresInDays: {
        type: "number",
        description: "Optional expiration in days (leave empty for no expiration)",
      }
    },
    required: ["name"]
  }
};

/**
 * Define the delete-api-key tool schema
 * This tool deletes an existing API key by ID
 */
export const deleteApiKeyToolSchema: Tool = {
  name: "delete-api-key",
  description: "Delete an existing Tusky API key",
  inputSchema: {
    type: "object",
    properties: {
      keyId: {
        type: "string",
        description: "ID of the API key to delete",
      }
    },
    required: ["keyId"]
  }
};

/**
 * Implementation of get-api-keys tool
 * Retrieves all API keys for the authenticated user
 */
export async function getApiKeys(): Promise<GetApiKeysResponse> {
  // Check if user is authenticated
  if (!apiClient.getAuthToken()) {
    return {
      success: false,
      error: "authentication_required",
      message: "Authentication required to retrieve API keys. Please authenticate first using verify-challenge."
    };
  }
  
  // Call the API client to get all API keys
  const response = await apiClient.getApiKeys();
  
  return response;
}

/**
 * Implementation of create-api-key tool
 * Creates a new API key with the specified name and optional expiration
 */
export async function createApiKey(args: { name: string; expiresInDays?: number }): Promise<CreateApiKeyResponse> {
  const { name, expiresInDays } = args;
  
  // Check if user is authenticated
  if (!apiClient.getAuthToken()) {
    return {
      success: false,
      error: "authentication_required",
      message: "Authentication required to create API keys. Please authenticate first using verify-challenge."
    };
  }
  
  // Validate the key name
  if (!name || name.trim() === "") {
    return {
      success: false,
      error: "validation_error",
      message: "API key name is required"
    };
  }
  
  // Check if expiration is valid if provided
  if (expiresInDays !== undefined) {
    if (expiresInDays <= 0) {
      return {
        success: false,
        error: "validation_error",
        message: "API key expiration must be a positive number of days"
      };
    }
  }
  
  // Call the API client to create the API key
  const response = await apiClient.createApiKey(name, expiresInDays);
  
  return response;
}

/**
 * Implementation of delete-api-key tool
 * Deletes an existing API key by ID
 */
export async function deleteApiKey(args: { keyId: string }): Promise<DeleteApiKeyResponse> {
  const { keyId } = args;
  
  // Check if user is authenticated
  if (!apiClient.getAuthToken()) {
    return {
      success: false,
      error: "authentication_required",
      message: "Authentication required to delete API keys. Please authenticate first using verify-challenge."
    };
  }
  
  // Validate the key ID
  if (!keyId || keyId.trim() === "") {
    return {
      success: false,
      error: "validation_error",
      message: "API key ID is required"
    };
  }
  
  // Call the API client to delete the API key
  const response = await apiClient.deleteApiKey(keyId);
  
  return response;
}

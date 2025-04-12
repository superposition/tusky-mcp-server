import { apiClient } from './apiClient';
import { VerifyChallengeResponse } from '../types/api';

/**
 * Interface for API key storage
 */
export interface ApiKeyInfo {
  token: string;
  expiresAt?: string; // ISO date string
  userId?: string;
}

/**
 * Authentication state manager for Tusky MCP Server
 * Handles storing and validating authentication tokens
 */
export class AuthManager {
  private apiKey: ApiKeyInfo | null = null;
  
  /**
   * Get the current stored API key info
   */
  public getApiKeyInfo(): ApiKeyInfo | null {
    return this.apiKey;
  }
  
  /**
   * Get the current API token
   */
  public getApiToken(): string | null {
    return this.apiKey?.token || null;
  }
  
  /**
   * Set API key information and propagate to API client
   */
  public setApiKey(keyInfo: ApiKeyInfo): void {
    this.apiKey = keyInfo;
    
    // Update API client with the new token
    if (keyInfo && keyInfo.token) {
      apiClient.setAuthToken(keyInfo.token);
    } else {
      apiClient.clearAuthToken();
    }
  }
  
  /**
   * Clear the stored API key
   */
  public clearApiKey(): void {
    this.apiKey = null;
    apiClient.clearAuthToken();
  }
  
  /**
   * Extract and store API key from verify-challenge response
   * Returns true if successful, false if failed
   */
  public storeAuthFromVerifyResponse(response: VerifyChallengeResponse): boolean {
    if (!response.success || !response.data?.token) {
      return false;
    }
    
    // Store API key info
    this.setApiKey({
      token: response.data.token,
      expiresAt: response.data.expiresAt
    });
    
    return true;
  }
  
  /**
   * Check if the current API key is valid (present and not expired)
   */
  public isApiKeyValid(): boolean {
    // No API key stored
    if (!this.apiKey || !this.apiKey.token) {
      return false;
    }
    
    // Check expiration if available
    if (this.apiKey.expiresAt) {
      const expiresAt = new Date(this.apiKey.expiresAt).getTime();
      const now = new Date().getTime();
      
      if (now >= expiresAt) {
        // Key has expired
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate API key format (basic validation)
   */
  public static isValidApiKeyFormat(token: string): boolean {
    // Basic validation - API keys should be non-empty strings
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return false;
    }
    
    // Check for expected prefix (assuming Tusky API keys start with "tsk_")
    if (!token.startsWith('tsk_')) {
      return false;
    }
    
    // Minimum length check
    if (token.length < 10) {
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const authManager = new AuthManager();

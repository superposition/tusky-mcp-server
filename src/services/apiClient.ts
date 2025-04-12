import axios, { AxiosInstance } from 'axios';
import { TuskyApiResponse, AuthChallengeResponse, VerifyChallengeResponse } from '../types/api';

/**
 * Client for making authenticated requests to the Tusky API
 */
export class TuskyApiClient {
  private apiClient: AxiosInstance;
  private apiToken: string | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.TUSKY_API_URL || 'https://api.tusky.io/v1',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Add Tusky API key to all requests if available
    if (process.env.TUSKY_API_KEY) {
      this.apiClient.defaults.headers.common['authorization'] = `Bearer ${process.env.TUSKY_API_KEY}`;
    }
  }

  /**
   * Set the authentication token for API requests
   */
  public setAuthToken(token: string): void {
    this.apiToken = token;
    this.apiClient.defaults.headers.common['authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear the authentication token
   */
  public clearAuthToken(): void {
    this.apiToken = null;
    delete this.apiClient.defaults.headers.common['authorization'];
    
    // Re-add Tusky API key if available
    if (process.env.TUSKY_API_KEY) {
      this.apiClient.defaults.headers.common['authorization'] = `Bearer ${process.env.TUSKY_API_KEY}`;
    }
  }

  /**
   * Get the current authentication token
   */
  public getAuthToken(): string | null {
    return this.apiToken;
  }

  /**
   * Create an authentication challenge for a wallet address
   */
  public async createChallenge(walletAddress: string): Promise<AuthChallengeResponse> {
    try {
      const response = await this.apiClient.post('/auth/challenge', {
        walletAddress,
      });
      return response.data as AuthChallengeResponse;
    } catch (error: any) {
      console.error('Error creating authentication challenge:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create authentication challenge',
      };
    }
  }

  /**
   * Verify a challenge response by submitting a wallet signature
   */
  public async verifyChallenge(walletAddress: string, signature: string, nonce: string): Promise<VerifyChallengeResponse> {
    try {
      const response = await this.apiClient.post('/auth/verify', {
        walletAddress,
        signature,
        nonce,
      });
      
      const verifyResponse = response.data as VerifyChallengeResponse;
      
      // If verification was successful and a token was returned, set it for future requests
      if (verifyResponse.success && verifyResponse.data?.token) {
        this.setAuthToken(verifyResponse.data.token);
      }
      
      return verifyResponse;
    } catch (error: any) {
      console.error('Error verifying authentication challenge:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to verify authentication challenge',
      };
    }
  }

  /**
   * Make a generic GET request to the Tusky API
   */
  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.apiClient.get(endpoint, { params });
    return response.data;
  }

  /**
   * Make a generic POST request to the Tusky API
   */
  public async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.apiClient.post(endpoint, data);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new TuskyApiClient();

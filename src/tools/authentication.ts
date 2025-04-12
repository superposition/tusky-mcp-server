import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { apiClient } from "../services/apiClient";
import { AuthChallengeResponse, VerifyChallengeResponse } from "../types/api";

/**
 * Authentication tools for Tusky wallet-based authentication
 */

/**
 * Define the create-challenge tool schema
 * This tool accepts a wallet address and returns a nonce to be signed
 */
export const createChallengeToolSchema: Tool = {
  name: "create-challenge",
  description: "Create an authentication challenge for wallet-based authentication with Tusky",
  inputSchema: {
    type: "object",
    properties: {
      walletAddress: {
        type: "string",
        description: "Wallet address used for authentication (e.g., Sui wallet address)",
      }
    },
    required: ["walletAddress"]
  }
};

/**
 * Define the verify-challenge tool schema
 * This tool accepts a wallet address, signature, and nonce and returns an authentication token
 */
export const verifyChallengeToolSchema: Tool = {
  name: "verify-challenge",
  description: "Verify an authentication challenge response by submitting a wallet signature",
  inputSchema: {
    type: "object",
    properties: {
      walletAddress: {
        type: "string",
        description: "Wallet address used for authentication",
      },
      signature: {
        type: "string",
        description: "Signature of the challenge nonce signed by the wallet's private key",
      },
      nonce: {
        type: "string",
        description: "The nonce received from the create-challenge tool",
      }
    },
    required: ["walletAddress", "signature", "nonce"]
  }
};

/**
 * Implementation of create-challenge tool
 */
export async function createChallenge(args: { walletAddress: string }): Promise<AuthChallengeResponse> {
  const { walletAddress } = args;
  
  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    return {
      success: false,
      error: "validation_error",
      message: "Invalid wallet address format"
    };
  }
  
  // Call the API client to create an authentication challenge
  const response = await apiClient.createChallenge(walletAddress);
  
  // Return the response
  return response;
}

/**
 * Implementation of verify-challenge tool
 */
export async function verifyChallenge(args: { 
  walletAddress: string; 
  signature: string; 
  nonce: string 
}): Promise<VerifyChallengeResponse> {
  const { walletAddress, signature, nonce } = args;
  
  // Validate inputs
  if (!isValidWalletAddress(walletAddress)) {
    return {
      success: false,
      error: "validation_error",
      message: "Invalid wallet address format"
    };
  }
  
  if (!signature || signature.trim() === "") {
    return {
      success: false,
      error: "validation_error",
      message: "Signature is required"
    };
  }
  
  if (!nonce || nonce.trim() === "") {
    return {
      success: false,
      error: "validation_error",
      message: "Nonce is required"
    };
  }
  
  // Call the API client to verify the challenge response
  const response = await apiClient.verifyChallenge(walletAddress, signature, nonce);
  
  return response;
}

/**
 * Helper function to validate wallet address format
 * This is a simplified validation, real implementation would depend on 
 * the specific blockchain wallet format (e.g., Sui, Ethereum, etc.)
 */
function isValidWalletAddress(address: string): boolean {
  // Basic validation - actual implementation would vary based on blockchain
  // For Sui addresses, they should be 42 characters long (0x + 40 hex chars)
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Simple regex for a hex address with 0x prefix
  // For Sui: Should match pattern like 0x1234...abcd (42 chars total)
  return /^0x[a-fA-F0-9]{40}$/i.test(address);
}

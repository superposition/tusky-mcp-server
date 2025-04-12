// src/tools/index.ts (Updated with vault modification tools)

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createChallengeToolSchema, verifyChallengeToolSchema, checkAuthStatusToolSchema } from "./authentication";
import { getApiKeysToolSchema, createApiKeyToolSchema, deleteApiKeyToolSchema } from "./apiKeys";

// We don't import vault tool schemas directly since they're registered 
// through the registerVaultTools function in the TuskyMcpServer class

/**
 * Export all Tusky MCP tools 
 */
export const tuskyTools: Tool[] = [
  // Authentication tools
  createChallengeToolSchema,
  verifyChallengeToolSchema,
  checkAuthStatusToolSchema,
  
  // API Key Management tools
  getApiKeysToolSchema,
  createApiKeyToolSchema,
  deleteApiKeyToolSchema,
  
  // Vault tools are registered dynamically through registerVaultTools 
  // and registerVaultModificationTools in the TuskyMcpServer class
  
  // Utility tools
  {
    name: "ping",
    description: "Check if the Tusky MCP server is running correctly",
    schema: {} // No parameters needed
  }
];
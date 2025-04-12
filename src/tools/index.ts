import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createChallengeToolSchema, verifyChallengeToolSchema, checkAuthStatusToolSchema } from "./authentication";
import { getApiKeysToolSchema, createApiKeyToolSchema, deleteApiKeyToolSchema } from "./apiKeys";

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
  
  // Add more tools as they're implemented in subsequent tasks
];

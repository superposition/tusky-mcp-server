// src/tools/index.ts (Updated with folder and file tools)

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createChallengeToolSchema, verifyChallengeToolSchema, checkAuthStatusToolSchema } from "./authentication";
import { getApiKeysToolSchema, createApiKeyToolSchema, deleteApiKeyToolSchema } from "./apiKeys";

// We don't import vault, folder, or file tool schemas directly since they're registered 
// through the register*Tools functions in the TuskyMcpServer class

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
  
  // Folder tools are registered dynamically through registerFolderTools 
  // and registerFolderModificationTools in the TuskyMcpServer class
  
  // File tools are registered dynamically through registerFileTools 
  // in the TuskyMcpServer class
  
  // Utility tools
  {
    name: "ping",
    description: "Check if the Tusky MCP server is running correctly",
    schema: {} // No parameters needed
  }
];
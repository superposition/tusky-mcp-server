// src/tools/index.ts (Updated with file metadata tools)

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createChallengeToolSchema, verifyChallengeToolSchema, checkAuthStatusToolSchema } from "./authentication";
import { getApiKeysToolSchema, createApiKeyToolSchema, deleteApiKeyToolSchema } from "./apiKeys";

// We don't import vault, folder, file, search, upload, or metadata tool schemas directly since they're registered 
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
  
  // File metadata tools are registered dynamically through registerFileMetadataTools
  // in the TuskyMcpServer class
  
  // Search tools are registered dynamically through registerSearchTools
  // in the TuskyMcpServer class
  
  // Upload tools are registered dynamically through registerUploadTools
  // in the TuskyMcpServer class
  
  // Utility tools
  {
    name: "ping",
    description: "Check if the Tusky MCP server is running correctly",
    schema: {} // No parameters needed
  }
];

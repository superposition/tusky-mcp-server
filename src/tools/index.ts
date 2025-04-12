import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createChallengeToolSchema, verifyChallengeToolSchema } from "./authentication";

/**
 * Export all Tusky MCP tools 
 */
export const tuskyTools: Tool[] = [
  // Authentication tools
  createChallengeToolSchema,
  verifyChallengeToolSchema,
  
  // Add more tools as they're implemented in subsequent tasks
];

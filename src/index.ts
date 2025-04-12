#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema, Tool} from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { tuskyTools } from "./tools";
import { createChallenge, verifyChallenge, checkAuthStatus } from "./tools/authentication";
import { getApiKeys, createApiKey, deleteApiKey } from "./tools/apiKeys";
import { TuskyApiResponse } from "./types/api";
import { apiClient } from "./services/apiClient";
import { authManager } from "./services/authManager";

// Load environment variables
dotenv.config();

// Check for Tusky API key
const TUSKY_API_KEY = process.env.TUSKY_API_KEY;
if (!TUSKY_API_KEY) {
  throw new Error("TUSKY_API_KEY environment variable is required");
}

class TuskyMcpClient {
  // Core client properties
  private server: Server;
  
  constructor() {
    this.server = new Server(
      {
        name: "tusky-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    // Error handling setup
    this.server.onerror = (error) => {
      console.error("[Tusky MCP Error]", error);
    };

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Return all registered Tusky tools
      return { tools: tuskyTools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let response: TuskyApiResponse = {}; // Initialize with default or empty value
        const args = request.params.arguments ?? {};

        switch (request.params.name) {
          case "create-challenge":
            console.log("create-challenge tool called");
            response = await createChallenge(args as { walletAddress: string });
            break;

          case "verify-challenge":
            console.log("verify-challenge tool called");
            response = await verifyChallenge(args as { 
              walletAddress: string; 
              signature: string; 
              nonce: string 
            });
            break;
            
          case "check-auth-status":
            console.log("check-auth-status tool called");
            response = await checkAuthStatus();
            break;
            
          case "get-api-keys":
            console.log("get-api-keys tool called");
            response = await getApiKeys();
            break;
            
          case "create-api-key":
            console.log("create-api-key tool called");
            response = await createApiKey(args as { 
              name: string; 
              expiresInDays?: number 
            });
            break;
            
          case "delete-api-key":
            console.log("delete-api-key tool called");
            response = await deleteApiKey(args as { 
              keyId: string 
            });
            break;

          case "ping":
            console.log("ping tool called");
            response = {
              success: true,
              message: "Tusky MCP server is running and connected successfully",
              data: {
                timestamp: new Date().toISOString(),
                serverInfo: {
                  name: "tusky-mcp-server",
                  version: "0.1.0"
                },
                authStatus: authManager.isApiKeyValid() ? "authenticated" : "not_authenticated"
              }
            };
            break;

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }

        return {
          content: [{
            type: "text",
            text: formatResults(response)
          }]
        };
      } catch (error: any) {
        // Handle errors appropriately
        console.error("[Error in tool handler]", error);
        return {
          content: [{
            type: "text",
            text: `Tusky API error: ${error.message}`
          }],
          isError: true,
        }
      }
    });
  }

  // Run the server
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tusky MCP server running on stdio");
  }
}

// Format results for display
function formatResults(response: TuskyApiResponse): string {
  if (response.success === false || response.error) {
    return `Error: ${response.message || response.error || "Unknown error"}`;
  }
  
  // Format success responses
  let result = "";
  if (response.message) {
    result += `${response.message}\n\n`;
  }
  
  if (response.data) {
    // Format the data in a readable way
    result += JSON.stringify(response.data, null, 2);
  } else {
    result += JSON.stringify(response, null, 2);
  }
  
  return result;
}

// Export server start function
export async function serve(): Promise<void> {
  const client = new TuskyMcpClient();
  await client.run();
}

// Start the server when this file is run directly
const server = new TuskyMcpClient();
server.run().catch(console.error);

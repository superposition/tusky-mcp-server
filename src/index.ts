#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema, Tool} from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { tuskyTools } from "./tools";
import { createChallenge, verifyChallenge, checkAuthStatus } from "./tools/authentication";
import { getApiKeys, createApiKey, deleteApiKey } from "./tools/apiKeys";
import { registerVaultTools } from "./tools/vaults";
import { registerVaultModificationTools } from "./tools/vaultModification";
import { registerFolderTools, registerFolderModificationTools } from "./tools/folders";
import { registerFileTools } from "./tools/files";
import { registerUserTools } from "./tools/user";
import { registerSearchTools } from "./tools/search"; // Import search tools
import { registerUploadTools } from "./tools/uploads"; // Import upload tools
import { TuskyApiResponse } from "./types/api";
import { apiClient, ApiClient } from "./services/apiClient";
import { authManager } from "./services/authManager";
import { VaultClient, createVaultClient } from "./services/vaultClient";
import { UserClient } from "./clients/user";

// Load environment variables
dotenv.config();

// Check for Tusky API key
const TUSKY_API_KEY = process.env.TUSKY_API_KEY;
if (!TUSKY_API_KEY) {
  throw new Error("TUSKY_API_KEY environment variable is required");
}

export class TuskyMcpServer {
  // Core client properties
  private server: Server;
  private vaultClient: VaultClient | null = null;
  private userClient: UserClient | null = null;
  
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
    
    // Register all tools
    this.registerAllTools();
  }

  /**
   * Register all available tools
   */
  private registerAllTools(): void {
    // Register vault listing and retrieval tools
    registerVaultTools(this);
    
    // Register vault creation and modification tools
    registerVaultModificationTools(this);

    // Register folder listing and retrieval tools
    registerFolderTools(this);
    
    // Register folder creation and modification tools
    registerFolderModificationTools(this);
    
    // Register file listing and retrieval tools
    registerFileTools(this);
    
    // Register user profile tools
    registerUserTools(this);
    
    // Register search tools
    registerSearchTools(this);
    
    // Register upload tools
    registerUploadTools(this);
  }

  /**
   * Register a tool with the server
   */
  public registerTool(tool: Tool): void {
    tuskyTools.push(tool);
  }

  /**
   * Get the vault client instance
   * @returns The vault client for making API requests
   */
  public getVaultClient(): VaultClient {
    if (!this.vaultClient) {
      this.vaultClient = createVaultClient(apiClient);
    }
    return this.vaultClient;
  }

  /**
   * Get the user client instance
   * @returns The user client for making API requests
   */
  public getUserClient(): UserClient {
    if (!this.userClient) {
      this.userClient = new UserClient(apiClient);
    }
    return this.userClient;
  }

  /**
   * Check if the current session is authenticated
   * @returns True if authenticated, false otherwise
   */
  public isAuthenticated(): boolean {
    return authManager.isApiKeyValid();
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

          // The vault tools (list-vaults, get-vault, create-vault, update-vault, delete-vault)
          // and folder tools (list-folders, get-folder, create-folder, update-folder, delete-folder)
          // and file tools (list-files, get-file)
          // and user tools (get-profile, update-profile)
          // and search tools (search-content)
          // and upload tools (initiate-upload, get-upload-status)
          // are registered through their respective register*Tools functions
          // and executed through the tool executor system

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
  const client = new TuskyMcpServer();
  await client.run();
}

// Start the server when this file is run directly
const server = new TuskyMcpServer();
server.run().catch(console.error);

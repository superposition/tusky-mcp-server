#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema, Tool} from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config();

// Check for Tusky API key
const TUSKY_API_KEY = process.env.TUSKY_API_KEY;
if (!TUSKY_API_KEY) {
  throw new Error("TUSKY_API_KEY environment variable is required");
}

// Define API response interfaces for Tusky integration
interface TuskyApiResponse {
  // Common Tusky API response properties
  success?: boolean;
  error?: string;
  message?: string;
  data?: any;
}

interface AuthResponse extends TuskyApiResponse {
  token?: string;
  expires?: string;
}

class TuskyMcpClient {
  // Core client properties
  private server: Server;
  private apiClient: any;
  private apiToken: string | null = null;

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

    // Setup Tusky API client
    this.apiClient = axios.create({
      baseURL: process.env.TUSKY_API_URL || 'https://api.tusky.io/v1',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${TUSKY_API_KEY}`
      },
      timeout: 10000, // 10 seconds timeout
    });

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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Define the Tusky tools here (placeholder for now)
      const tools: Tool[] = [
        {
          name: "ping",
          description: "Simple tool to test connection to the Tusky MCP server.",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        // Add more Tusky tools as they are implemented
      ];
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let response: TuskyApiResponse = {}; // Initialize with default or empty value
        const args = request.params.arguments ?? {};

        switch (request.params.name) {
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
                }
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

  // Placeholder for future tool method implementations
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

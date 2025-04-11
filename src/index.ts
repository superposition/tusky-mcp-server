#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema, Tool} from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check for API key (replace with your own API key check)
const API_KEY = process.env.YOUR_API_KEY;
if (!API_KEY) {
  throw new Error("YOUR_API_KEY environment variable is required");
}

// Define your response interface
interface YourApiResponse {
  // Define your API response structure here
  // For example:
  // query?: string;
  // results?: any[];
  // etc...
}

class TemplateClient {
  // Core client properties
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "your-mcp-template",
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

    // Setup API client here if needed
    // For example, with axios:
    // this.apiClient = axios.create({
    //   headers: {
    //     'accept': 'application/json',
    //     'content-type': 'application/json',
    //     'authorization': `Bearer ${API_KEY}`
    //   }
    // });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    // Error handling setup
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
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
      // Define your tools here
      const tools: Tool[] = [
        {
          name: "example-tool-1",
          description: "Description of your first tool. Explain what it does, when to use it, and its capabilities.",
          inputSchema: {
            type: "object",
            properties: {
              // Define the parameters for your tool
              parameter1: { 
                type: "string", 
                description: "Description of parameter1" 
              },
              parameter2: {
                type: "number",
                description: "Description of parameter2",
                default: 10
              },
              // Add more parameters as needed
            },
            required: ["parameter1"] // List required parameters
          }
        },
        // Add more tools as needed
        {
          name: "example-tool-2",
          description: "Description of your second tool.",
          inputSchema: {
            type: "object",
            properties: {
              // Define the parameters for your second tool
              urls: { 
                type: "array",
                items: { type: "string" },
                description: "List of items to process"
              },
              // Add more parameters as needed
            },
            required: ["urls"] // List required parameters
          }
        },
      ];
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let response: YourApiResponse = {}; // Initialize with default or empty value
        const args = request.params.arguments ?? {};

        switch (request.params.name) {
          case "example-tool-1":
            // Call your first tool's functionality
            // response = await this.exampleTool1({
            //   parameter1: args.parameter1,
            //   parameter2: args.parameter2,
            //   // Add more parameters as needed
            // });
            console.log("example-tool-1 called with:", args);
            response = {/* your implementation result */};
            break;
          
          case "example-tool-2":
            // Call your second tool's functionality
            // response = await this.exampleTool2({
            //   urls: args.urls,
            //   // Add more parameters as needed
            // });
            console.log("example-tool-2 called with:", args);
            response = {/* your implementation result */};
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
        return {
          content: [{
            type: "text",
            text: `API error: ${error.message}`
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
    console.error("Template MCP server running on stdio");
  }

  // Implement your tool methods here
  // For example:
  // async exampleTool1(params: any): Promise<YourApiResponse> {
  //   // Implement your tool's functionality
  //   // This is where you would call your APIs or perform operations
  //   return { /* your response */ };
  // }
  //
  // async exampleTool2(params: any): Promise<YourApiResponse> {
  //   // Implement your tool's functionality
  //   return { /* your response */ };
  // }
}

// Format results for display
function formatResults(response: YourApiResponse): string {
  // Format your API response into human-readable text
  // This is just a placeholder - implement your own formatting logic
  return "Formatted results would appear here\n" + JSON.stringify(response, null, 2);
}

// Export server start function
export async function serve(): Promise<void> {
  const client = new TemplateClient();
  await client.run();
}

// Start the server when this file is run directly
const server = new TemplateClient();
server.run().catch(console.error);
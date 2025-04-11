#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema, Tool} from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
// Fix import for node-fetch v2 by importing without type checking
// @ts-ignore
import fetch from "node-fetch";
import { URLSearchParams } from "url";

// Load environment variables
dotenv.config();

// Check for Tusky API key
const TUSKY_API_KEY = process.env.TUSKY_API_KEY;
if (!TUSKY_API_KEY) {
  throw new Error("TUSKY_API_KEY environment variable is required");
}

// Tusky API base URL
const TUSKY_API_BASE = process.env.TUSKY_API_BASE || "https://api.tusky.io";

// Define Tusky API response interfaces
interface TuskyApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface TuskyPost {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  likes: number;
  comments: number;
}

class TuskyClient {
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
      // Define Tusky API tools
      const tools: Tool[] = [
        {
          name: "tusky_get_posts",
          description: "Retrieve posts from the Tusky social media platform. Can filter by author, hashtags, or keywords.",
          inputSchema: {
            type: "object",
            properties: {
              author: { 
                type: "string", 
                description: "Filter posts by author username" 
              },
              hashtag: {
                type: "string",
                description: "Filter posts by hashtag (without the # symbol)"
              },
              keyword: {
                type: "string",
                description: "Filter posts containing this keyword"
              },
              limit: {
                type: "number",
                description: "Maximum number of posts to return",
                default: 10
              }
            }
          }
        },
        {
          name: "tusky_create_post",
          description: "Create a new post on the Tusky platform.",
          inputSchema: {
            type: "object",
            properties: {
              content: { 
                type: "string", 
                description: "The content of the post" 
              },
              visibility: {
                type: "string",
                description: "Post visibility (public, private, followers)",
                enum: ["public", "private", "followers"],
                default: "public"
              }
            },
            required: ["content"]
          }
        },
        {
          name: "tusky_search_users",
          description: "Search for Tusky users by username or display name.",
          inputSchema: {
            type: "object",
            properties: {
              query: { 
                type: "string", 
                description: "Search query for username or display name" 
              },
              limit: {
                type: "number",
                description: "Maximum number of users to return",
                default: 10
              }
            },
            required: ["query"]
          }
        },
        {
          name: "tusky_get_user_profile",
          description: "Get detailed information about a Tusky user.",
          inputSchema: {
            type: "object",
            properties: {
              username: { 
                type: "string", 
                description: "Username of the Tusky user" 
              }
            },
            required: ["username"]
          }
        }
      ];
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let response: TuskyApiResponse = { success: false }; 
        const args = request.params.arguments ?? {};

        switch (request.params.name) {
          case "tusky_get_posts":
            response = await this.getPosts({
              author: args.author,
              hashtag: args.hashtag,
              keyword: args.keyword,
              limit: args.limit || 10
            });
            break;
          
          case "tusky_create_post":
            response = await this.createPost({
              content: args.content,
              visibility: args.visibility || "public"
            });
            break;

          case "tusky_search_users":
            response = await this.searchUsers({
              query: args.query,
              limit: args.limit || 10
            });
            break;

          case "tusky_get_user_profile":
            response = await this.getUserProfile({
              username: args.username
            });
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
        console.error("API error:", error);
        // Handle errors appropriately
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

  // Implement Tusky API methods
  async getPosts(params: any): Promise<TuskyApiResponse> {
    const queryParams = new URLSearchParams();
    if (params.author) queryParams.append('author', params.author);
    if (params.hashtag) queryParams.append('hashtag', params.hashtag);
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${TUSKY_API_BASE}/posts?${queryParams.toString()}`;
    return this.makeApiRequest('GET', url);
  }

  async createPost(params: any): Promise<TuskyApiResponse> {
    const url = `${TUSKY_API_BASE}/posts`;
    return this.makeApiRequest('POST', url, params);
  }

  async searchUsers(params: any): Promise<TuskyApiResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${TUSKY_API_BASE}/users/search?${queryParams.toString()}`;
    return this.makeApiRequest('GET', url);
  }

  async getUserProfile(params: any): Promise<TuskyApiResponse> {
    const url = `${TUSKY_API_BASE}/users/${params.username}`;
    return this.makeApiRequest('GET', url);
  }

  // Helper method to make API requests
  private async makeApiRequest(method: string, url: string, body?: any): Promise<TuskyApiResponse> {
    try {
      // Define headers with the correct type
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TUSKY_API_KEY}`,
        'Accept': 'application/json'
      };

      // Define request options
      let options: any = {
        method,
        headers
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      // Use a more direct approach with explicit type casting
      const response = await fetch(url, options as any);
      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error(`Error making ${method} request to ${url}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Format results for display
function formatResults(response: TuskyApiResponse): string {
  if (!response.success) {
    return `Error: ${response.error || 'Unknown error occurred'}`;
  }

  // Format based on data structure
  if (Array.isArray(response.data)) {
    return response.data.map((item, index) => {
      if (item.content) {  // If it's a post
        return `Post ${index + 1}:\n  Author: ${item.author}\n  Content: ${item.content}\n  Likes: ${item.likes}\n  Comments: ${item.comments}\n  Time: ${item.timestamp}\n`;
      } else {  // Generic handling
        return `Item ${index + 1}:\n${Object.entries(item).map(([key, value]) => `  ${key}: ${value}`).join('\n')}\n`;
      }
    }).join('\n');
  } else if (response.data && typeof response.data === 'object') {
    return Object.entries(response.data).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}:\n${JSON.stringify(value, null, 2)}`;
      }
      return `${key}: ${value}`;
    }).join('\n');
  }

  return JSON.stringify(response.data, null, 2);
}

// Export server start function
export async function serve(): Promise<void> {
  const client = new TuskyClient();
  await client.run();
}

// Start the server when this file is run directly
const server = new TuskyClient();
server.run().catch(console.error);
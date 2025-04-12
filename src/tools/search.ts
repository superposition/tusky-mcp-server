// src/tools/search.ts

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { TuskyMcpServer } from "../index";
import { SearchParams, SearchResponse } from "../types/search";
import { createSearchClient } from "../services/searchClient";
import { apiClient } from "../services/apiClient";
import { authManager } from "../services/authManager";

// Search tool name
const SEARCH_TOOL = "search-content";

/**
 * Register search tools with the MCP server
 * @param server The Tusky MCP server instance
 */
export function registerSearchTools(server: TuskyMcpServer): void {
  server.registerTool({
    name: SEARCH_TOOL,
    description: "Search across vaults, folders, and files in Tusky.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query string",
        },
        vaultId: {
          type: "string",
          description: "Optional vault ID to limit search to a specific vault",
        },
        folderId: {
          type: "string",
          description: "Optional folder ID to limit search to a specific folder",
        },
        type: {
          type: "string",
          enum: ["all", "vault", "folder", "file"],
          description: "Optional filter by content type",
          default: "all",
        },
        status: {
          type: "string",
          enum: ["active", "archived", "deleted"],
          description: "Optional filter by content status",
          default: "active",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Optional tags to filter by",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20)",
        },
        nextToken: {
          type: "string",
          description: "Pagination token for getting the next page of results",
        },
      },
      required: ["query"],
    },
    execute: async (params: SearchParams): Promise<SearchResponse> => {
      // Check authentication
      if (!authManager.isApiKeyValid()) {
        return {
          success: false,
          error: "Authentication required",
          message: "You must be authenticated to search content",
        };
      }

      try {
        // Create search client
        const searchClient = createSearchClient(apiClient);
        
        // Execute search
        const response = await searchClient.search(params);
        
        // Format the response for display
        return formatSearchResponse(response);
      } catch (error: any) {
        console.error("Error executing search:", error);
        return {
          success: false,
          error: error.message,
          message: "Failed to execute search",
        };
      }
    },
  });
}

/**
 * Format the search response for better display in the MCP client
 * @param response The raw search response from the API
 * @returns Formatted search response
 */
function formatSearchResponse(response: SearchResponse): SearchResponse {
  if (!response.success || !response.data?.items) {
    return response;
  }

  // Add a summary message
  const totalItems = response.data.items.length;
  const totalResults = response.data.totalResults || totalItems;
  const hasMore = !!response.data.nextToken;
  
  let message = `Found ${totalResults} results for your search`;
  if (totalItems < totalResults) {
    message += ` (showing ${totalItems})`;
  }
  
  if (hasMore) {
    message += ". Use nextToken to see more results.";
  }
  
  // Categorize results by type for better display
  const categorized = {
    vaults: response.data.items.filter(item => item.type === 'vault'),
    folders: response.data.items.filter(item => item.type === 'folder'),
    files: response.data.items.filter(item => item.type === 'file'),
  };
  
  // Add summary counts by category
  message += `\n- Vaults: ${categorized.vaults.length}`;
  message += `\n- Folders: ${categorized.folders.length}`;
  message += `\n- Files: ${categorized.files.length}`;
  
  return {
    ...response,
    message,
  };
}

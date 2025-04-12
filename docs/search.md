# Tusky MCP Server Search Documentation

## Overview

The search functionality in Tusky MCP Server allows you to search across vaults, folders, and files in your Tusky storage system using various criteria. This feature makes it easy to find content across your entire storage space or within specific vaults and folders.

## Search Tool

### Tool Name: `search-content`

The search feature is implemented as a tool called `search-content` that can be accessed through the Model Context Protocol (MCP) interface.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | The search query string |
| vaultId | string | No | Optional vault ID to limit search to a specific vault |
| folderId | string | No | Optional folder ID to limit search to a specific folder |
| type | string | No | Optional filter by content type ('all', 'vault', 'folder', 'file'). Default: 'all' |
| status | string | No | Optional filter by content status ('active', 'archived', 'deleted'). Default: 'active' |
| tags | array | No | Optional array of tags to filter by |
| limit | number | No | Maximum number of results to return (default: 20) |
| nextToken | string | No | Pagination token for getting the next page of results |

## Response Format

The search tool returns a response with the following structure:

```json
{
  "success": true,
  "message": "Found X results for your search",
  "data": {
    "items": [
      {
        "id": "item-id",
        "name": "Item Name",
        "type": "vault|folder|file",
        "path": "/path/to/item",
        "contentType": "application/type",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-02T00:00:00Z",
        "vaultId": "vault-id",
        "parentId": "parent-folder-id",
        "matchInfo": [
          {
            "field": "name|content",
            "snippet": "Matching text snippet..."
          }
        ]
      }
    ],
    "totalResults": 42,
    "nextToken": "pagination-token"
  }
}
```

## Usage Examples

### Basic Search

```
search-content:
  query: "important document"
```

### Search in a Specific Vault

```
search-content:
  query: "meeting notes"
  vaultId: "vault-123456"
```

### Search for Files Only

```
search-content:
  query: "quarterly report"
  type: "file"
```

### Search with Multiple Filters

```
search-content:
  query: "project proposal"
  vaultId: "vault-123456"
  type: "file"
  tags: ["project", "finance"]
  limit: 50
```

### Pagination Example

```
search-content:
  query: "annual report"
  nextToken: "token-from-previous-response"
```

### Search for Files with Specific Content Type

```
search-content:
  query: "presentation"
  type: "file"
  contentType: "application/pdf"
```

### Search for Recently Created Content

```
search-content:
  query: "recent"
  createdAfter: "2025-01-01T00:00:00Z"
```

### Search for Content with Multiple Tags

```
search-content:
  query: "marketing campaign"
  tags: ["2025", "social-media", "brand"]
```

## Best Practices

1. **Use specific search terms** - More specific queries will yield more relevant results
2. **Filter by type** - If you know you're looking for a specific type of content (vault, folder, or file), use the `type` parameter to narrow results
3. **Use pagination** - If searching a large dataset, use the `limit` parameter and handle pagination with `nextToken`
4. **Tag your content** - Using consistent tags makes filtering by tags more effective
5. **Combine search criteria** - For more precise results, combine multiple search parameters
6. **Use content type filtering** - When looking for specific file formats, include the content type in your search

## Troubleshooting

- If search returns too many results, try narrowing your search with additional filters
- If search returns no results, try broadening your search by removing filters or simplifying your query
- Ensure you are authenticated before using the search tool
- For performance reasons, consider limiting your search to specific vaults when possible
- If experiencing slow search performance, try reducing the `limit` parameter

## Limitations

- Search is performed across content the authenticated user has access to
- Full-text search capabilities depend on the Tusky API implementation
- Performance may vary depending on the size of your storage and complexity of the search query
- Some special characters may need to be escaped in search queries

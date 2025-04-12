# File Metadata Tools

This document outlines the tools available for managing file metadata in Tusky through the MCP interface. File metadata allows you to add, update, and retrieve custom structured information associated with files stored in Tusky.

## Overview

File metadata enables you to:

- Associate structured data with files (e.g., tags, descriptions, custom properties)
- Store JSON-compatible values (strings, numbers, booleans, arrays, objects)
- Organize and categorize files with custom attributes
- Retrieve file-specific information without downloading the entire file
- Implement custom workflows using metadata as state

## Available Tools

### 1. get-file-metadata

Retrieves metadata for a specific file.

**Parameters:**
- `id` (required): The ID of the file to retrieve metadata for
- `vaultId` (required): The ID of the vault containing the file
- `key` (optional): A specific metadata key to retrieve (if omitted, all metadata is returned)

**Example Usage:**
```json
{
  "id": "file123",
  "vaultId": "vault456",
  "key": "category"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "category": "document"
    }
  }
}
```

### 2. update-file-metadata

Updates or adds metadata for a specific file.

**Parameters:**
- `id` (required): The ID of the file to update metadata for
- `vaultId` (required): The ID of the vault containing the file
- `metadata` (required): An object containing the metadata keys and values to update
- `merge` (optional, default: true): Whether to merge with existing metadata (true) or replace all metadata (false)

**Example Usage:**
```json
{
  "id": "file123",
  "vaultId": "vault456",
  "metadata": {
    "category": "document",
    "tags": ["important", "reviewed"],
    "lastReviewed": "2023-09-15",
    "customData": {
      "reviewedBy": "John Doe",
      "score": 4.5
    }
  },
  "merge": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "File metadata merged with existing metadata successfully.",
  "data": {
    "metadata": {
      "category": "document",
      "tags": ["important", "reviewed"],
      "lastReviewed": "2023-09-15",
      "customData": {
        "reviewedBy": "John Doe",
        "score": 4.5
      }
    }
  }
}
```

### 3. delete-file-metadata

Deletes metadata for a specific file, either a single key or all metadata.

**Parameters:**
- `id` (required): The ID of the file to delete metadata from
- `vaultId` (required): The ID of the vault containing the file
- `key` (optional): A specific metadata key to delete (if omitted, all metadata will be deleted)
- `confirmed` (required when deleting all metadata): Set to true to confirm deletion of all metadata

**Example Usage - Delete Single Key:**
```json
{
  "id": "file123",
  "vaultId": "vault456",
  "key": "category"
}
```

**Example Usage - Delete All Metadata:**
```json
{
  "id": "file123",
  "vaultId": "vault456",
  "confirmed": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Metadata key \"category\" deleted successfully.",
  "data": {
    "id": "file123",
    "deletedKeys": ["category"]
  }
}
```

## Best Practices

1. **Structured Metadata**: Use consistent schemas for metadata across similar files
2. **Meaningful Keys**: Use descriptive key names that clearly indicate the purpose of the metadata
3. **Avoid Large Values**: Keep metadata values reasonably sized (under 100KB per file)
4. **Hierarchical Organization**: Use nested objects for related metadata properties
5. **Validation**: Implement validation in your application to ensure metadata consistency

## Use Cases

- **Document Management**: Store author information, revision history, and document status
- **Media Organization**: Add tags, categories, and custom attributes to media files
- **Workflow Status**: Track processing stages, approval status, or workflow position
- **Custom Properties**: Store application-specific data related to files
- **Search Enhancement**: Add searchable metadata that isn't contained in the file content

## Error Handling

When using file metadata tools, you may encounter these common errors:

- **Authentication Errors**: Ensure you're properly authenticated before using metadata tools
- **File Not Found**: Verify the file ID and vault ID are correct and the file exists
- **Permission Errors**: Confirm you have appropriate permissions for the file
- **Validation Errors**: Ensure metadata follows the expected format (JSON-compatible)

## Security Considerations

- File metadata is subject to the same access controls as the file itself
- Only users with appropriate permissions can view or modify file metadata
- Sensitive information should not be stored in file metadata unless appropriate access controls are in place

## Limitations

- Maximum metadata size per file: 1MB
- Maximum number of keys per file: 100
- Metadata values must be JSON-serializable
- Nested objects should not exceed 5 levels of depth

For more information about Tusky file operations, see the [File Operations](./file-operations.md) documentation.

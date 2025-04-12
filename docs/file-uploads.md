# File Upload Capability

This document describes the file upload capabilities in the Tusky MCP Server, which uses the [TUS protocol](https://tus.io/) for reliable, resumable file uploads.

## Overview

The TUS (Tus Resumable Upload Protocol) is an open protocol for resumable file uploads. It provides the following benefits:

1. **Resumable uploads**: If an upload is interrupted due to network issues, it can be resumed from where it left off.
2. **Integrity verification**: The protocol ensures that uploads complete correctly.
3. **Efficient for large files**: Particularly useful for large files that may take time to upload.
4. **Cross-platform compatibility**: Works across different platforms and client implementations.

## Tools

The Tusky MCP Server provides two primary tools for file uploads:

### `initiate-upload`

Initiates a new file upload session using the TUS protocol.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filename | string | Yes | Name of the file to upload |
| mimeType | string | Yes | MIME type of the file |
| vaultId | string | Yes | ID of the vault to upload to |
| parentId | string | Yes | ID of the parent folder |
| size | number | Yes | Size of the file in bytes |
| encryptionKey | string | No | Optional AES encryption key for encrypted vaults |

**Response:**

```json
{
  "success": true,
  "data": {
    "upload": {
      "id": "upload_id",
      "uploadUrl": "https://api.tusky.io/tus/upload_endpoint",
      "expiresAt": "2025-04-19T05:30:00Z",
      "status": "pending",
      "size": 1024000,
      "bytesUploaded": 0
    },
    "tusEndpoint": "https://api.tusky.io/tus/",
    "instructions": "To upload using the TUS protocol: 1. Use a TUS client to upload to the provided uploadUrl..."
  }
}
```

### `get-upload-status`

Gets the status of an ongoing file upload.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uploadId | string | Yes | ID of the upload session |

**Response:**

```json
{
  "success": true,
  "message": "Upload is in progress. 45% complete (461800 of 1024000 bytes).",
  "data": {
    "upload": {
      "id": "upload_id",
      "uploadUrl": "https://api.tusky.io/tus/upload_endpoint",
      "expiresAt": "2025-04-19T05:30:00Z",
      "status": "in-progress",
      "size": 1024000,
      "bytesUploaded": 461800
    },
    "progress": 45,
    "remainingBytes": 562200
  }
}
```

## Using TUS Protocol with MCP

To work with the TUS protocol through the Tusky MCP Server:

1. **Initiate the upload**: Use the `initiate-upload` tool to create an upload session and get a TUS upload URL.

2. **Perform the upload**: Use a TUS client library to upload the file to the provided URL. Popular TUS client libraries include:
   - [tus-js-client](https://github.com/tus/tus-js-client) for JavaScript
   - [tus-java-client](https://github.com/tus/tus-java-client) for Java
   - [tuspy](https://github.com/tus/tuspy) for Python

3. **Monitor progress**: Use the `get-upload-status` tool to check on the upload progress.

### Example Workflow

```javascript
// 1. Initiate the upload
const initiateResponse = await callTool("initiate-upload", {
  filename: "large-document.pdf",
  mimeType: "application/pdf",
  vaultId: "vault_123",
  parentId: "folder_456",
  size: 5242880 // 5MB
});

// 2. Extract the upload URL and ID
const uploadId = initiateResponse.data.upload.id;
const uploadUrl = initiateResponse.data.upload.uploadUrl;

// 3. Use a TUS client to upload the file (example with tus-js-client)
const upload = new tus.Upload(file, {
  endpoint: uploadUrl,
  retryDelays: [0, 1000, 3000, 5000],
  chunkSize: 1024 * 1024, // 1MB chunks
  metadata: {
    filename: "large-document.pdf",
    filetype: "application/pdf"
  },
  onProgress: (bytesUploaded, bytesTotal) => {
    const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
    console.log(`Upload progress: ${percentage}%`);
  },
  onSuccess: () => {
    console.log("Upload complete!");
  }
});

// Start the upload
upload.start();

// 4. Check upload status periodically
const statusResponse = await callTool("get-upload-status", {
  uploadId: uploadId
});

console.log(`Upload status: ${statusResponse.data.upload.status}`);
console.log(`Progress: ${statusResponse.data.progress}%`);
```

## Error Handling

Common errors that may occur during uploads:

1. **Authentication errors**: Ensure you are authenticated before attempting uploads.
2. **Storage quota exceeded**: Check the user's storage balance before large uploads.
3. **Invalid parameters**: Ensure all required parameters are provided and valid.
4. **Expired upload session**: TUS upload sessions expire after a certain period. Check the `expiresAt` property to know when to re-initiate.

## Best Practices

1. **Pre-check available storage**: Use the `get-storage-balance` tool to check if the user has enough space before initiating large uploads.
2. **Handle intermittent connectivity**: Implement retry logic in your client application.
3. **Validate file types**: Confirm the file type is supported by Tusky before uploading.
4. **Progress feedback**: Provide visual feedback to users about upload progress.
5. **Cleanup incomplete uploads**: Monitor for abandoned uploads and handle them appropriately.

## Security Considerations

1. **Encryption keys**: When working with encrypted vaults, ensure encryption keys are transmitted securely.
2. **Authorization**: Only authenticated users can initiate and manage uploads.
3. **File validation**: Validate file types and sizes before uploading to prevent security issues.

## Limitations

1. **Session expiration**: Upload sessions expire after a period of inactivity (typically 24 hours).
2. **Maximum file size**: Check Tusky API documentation for current file size limits.
3. **Concurrent uploads**: The number of concurrent uploads may be limited based on the user's subscription plan.

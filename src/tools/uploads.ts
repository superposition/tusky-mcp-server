import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { UploadClient, createUploadClient } from "../services/uploadClient";
import { apiClient } from "../services/apiClient";
import { authManager } from "../services/authManager";
import { TuskyMcpServer } from "../index";

// Initialize the upload client
const uploadClient = createUploadClient(apiClient);

// Schema for the initiate-upload tool
export const initiateUploadSchema: Tool = {
  name: "initiate-upload",
  description: "Initiates a new file upload session using the TUS protocol",
  schema: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description: "Name of the file to upload"
      },
      mimeType: {
        type: "string",
        description: "MIME type of the file"
      },
      vaultId: {
        type: "string",
        description: "ID of the vault to upload to"
      },
      parentId: {
        type: "string",
        description: "ID of the parent folder"
      },
      size: {
        type: "number",
        description: "Size of the file in bytes"
      },
      encryptionKey: {
        type: "string",
        description: "Optional AES encryption key for encrypted vaults"
      }
    },
    required: ["filename", "mimeType", "vaultId", "parentId", "size"]
  }
};

// Schema for the get-upload-status tool
export const getUploadStatusSchema: Tool = {
  name: "get-upload-status",
  description: "Gets the status of an ongoing file upload",
  schema: {
    type: "object",
    properties: {
      uploadId: {
        type: "string",
        description: "ID of the upload session"
      }
    },
    required: ["uploadId"]
  }
};

/**
 * Registers upload tools with the server
 * @param server The Tusky MCP server instance
 */
export function registerUploadTools(server: TuskyMcpServer): void {
  // Register the initiate-upload tool
  server.registerTool(initiateUploadSchema);
  
  // Register the get-upload-status tool
  server.registerTool(getUploadStatusSchema);
  
  // Add tool handlers
  registerUploadToolHandlers();
}

/**
 * Registers the handlers for upload tools
 */
function registerUploadToolHandlers(): void {
  // Handler for initiate-upload tool
  apiClient.registerToolHandler("initiate-upload", async (args: any) => {
    // Check authentication
    if (!authManager.isApiKeyValid()) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    try {
      // Initiate the upload
      const result = await uploadClient.initiateUpload({
        filename: args.filename,
        mimeType: args.mimeType,
        vaultId: args.vaultId,
        parentId: args.parentId,
        size: args.size,
        encryptionKey: args.encryptionKey
      });

      return result;
    } catch (error) {
      console.error("Error in initiate-upload handler:", error);
      return {
        success: false,
        error: `Failed to initiate upload: ${error.message}`
      };
    }
  });

  // Handler for get-upload-status tool
  apiClient.registerToolHandler("get-upload-status", async (args: any) => {
    // Check authentication
    if (!authManager.isApiKeyValid()) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    try {
      // Get upload status
      const result = await uploadClient.getUploadStatus(args.uploadId);
      
      // Add user-friendly status message
      if (result.success && result.data) {
        const { upload, progress } = result.data;
        let statusMessage = "";
        
        switch (upload.status) {
          case "pending":
            statusMessage = "Upload is pending. No data has been transferred yet.";
            break;
          case "in-progress":
            statusMessage = `Upload is in progress. ${progress}% complete (${upload.bytesUploaded} of ${upload.size} bytes).`;
            break;
          case "completed":
            statusMessage = `Upload completed successfully. File size: ${upload.size} bytes.`;
            break;
          case "failed":
            statusMessage = "Upload failed. Please try again.";
            break;
        }
        
        result.message = statusMessage;
      }
      
      return result;
    } catch (error) {
      console.error("Error in get-upload-status handler:", error);
      return {
        success: false,
        error: `Failed to get upload status: ${error.message}`
      };
    }
  });
}

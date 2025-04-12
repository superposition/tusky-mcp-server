import { ApiClient } from "./apiClient";
import { 
  InitiateUploadRequest, 
  InitiateUploadResponse, 
  GetUploadStatusResponse,
  UploadSession
} from "../types/uploads";
import { TuskyApiResponse } from "../types/api";

/**
 * Client for interacting with Tusky's file upload API using TUS protocol
 */
export class UploadClient {
  private client: ApiClient;
  private baseEndpoint: string = "/api/v1/uploads";

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Initiates a new upload session using the TUS protocol
   * @param request Upload request parameters
   * @returns Upload session details including TUS endpoint
   */
  async initiateUpload(request: InitiateUploadRequest): Promise<InitiateUploadResponse> {
    try {
      // Prepare metadata for TUS upload
      const metadata: Record<string, string> = {
        ...request.metadata,
        filename: request.filename,
        filetype: request.mimeType,
        vaultId: request.vaultId,
        parentId: request.parentId,
      };

      // Add encryption key if provided
      if (request.encryptionKey) {
        metadata.encryptionKey = request.encryptionKey;
      }

      // Create upload session
      const response = await this.client.post<InitiateUploadResponse>(
        `${this.baseEndpoint}/initiate`,
        {
          size: request.size,
          metadata
        }
      );

      // Enhance response with usage instructions
      if (response.data && response.data.upload) {
        response.data.instructions = `
          To upload using the TUS protocol:
          1. Use a TUS client to upload to the provided uploadUrl
          2. Set 'Upload-Length' header to the file size (${request.size} bytes)
          3. Set 'Content-Type' header to 'application/offset+octet-stream'
          4. Upload file data in chunks using PATCH requests
          5. Check upload status using 'get-upload-status' tool with the upload ID: ${response.data.upload.id}
        `;
      }

      return response;
    } catch (error) {
      console.error("Error initiating upload:", error);
      return {
        success: false,
        error: `Failed to initiate upload: ${error.message}`,
      };
    }
  }

  /**
   * Gets the status of an ongoing upload
   * @param uploadId ID of the upload session
   * @returns Current upload status and progress information
   */
  async getUploadStatus(uploadId: string): Promise<GetUploadStatusResponse> {
    try {
      const response = await this.client.get<TuskyApiResponse>(
        `${this.baseEndpoint}/${uploadId}/status`
      );

      // Format the response with additional useful information
      if (response.data && response.data.upload) {
        const upload = response.data.upload as UploadSession;
        const progress = Math.round((upload.bytesUploaded / upload.size) * 100);
        const remainingBytes = upload.size - upload.bytesUploaded;

        return {
          success: true,
          data: {
            upload,
            progress,
            remainingBytes
          }
        };
      }

      return response as GetUploadStatusResponse;
    } catch (error) {
      console.error("Error getting upload status:", error);
      return {
        success: false,
        error: `Failed to get upload status: ${error.message}`,
      };
    }
  }
}

// Create and export a factory function for the upload client
export function createUploadClient(apiClient: ApiClient): UploadClient {
  return new UploadClient(apiClient);
}

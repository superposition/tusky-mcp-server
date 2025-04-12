import { expect } from 'chai';
import sinon from 'sinon';
import { UploadClient } from '../../src/services/uploadClient';
import { ApiClient } from '../../src/services/apiClient';
import { 
  InitiateUploadRequest, 
  InitiateUploadResponse, 
  GetUploadStatusResponse 
} from '../../src/types/uploads';

describe('Upload Tools', () => {
  let uploadClient: UploadClient;
  let apiClientStub: sinon.SinonStubbedInstance<ApiClient>;
  
  beforeEach(() => {
    // Create a stubbed API client
    apiClientStub = sinon.createStubInstance(ApiClient);
    
    // Create the upload client with the stubbed API client
    uploadClient = new UploadClient(apiClientStub as unknown as ApiClient);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('initiateUpload', () => {
    it('should create a new upload session successfully', async () => {
      // Mock API response
      const mockResponse: InitiateUploadResponse = {
        success: true,
        data: {
          upload: {
            id: 'upload_123',
            uploadUrl: 'https://api.tusky.io/tus/upload_123',
            expiresAt: '2025-04-19T05:30:00Z',
            status: 'pending',
            size: 1024000,
            bytesUploaded: 0
          },
          tusEndpoint: 'https://api.tusky.io/tus/',
          instructions: ''
        }
      };
      
      // Setup the stub to return the mock response
      apiClientStub.post.resolves(mockResponse);
      
      // Test upload request
      const request: InitiateUploadRequest = {
        filename: 'test-file.pdf',
        mimeType: 'application/pdf',
        vaultId: 'vault_456',
        parentId: 'folder_789',
        size: 1024000
      };
      
      // Call the method
      const result = await uploadClient.initiateUpload(request);
      
      // Verify the API was called correctly
      expect(apiClientStub.post.calledOnce).to.be.true;
      expect(apiClientStub.post.firstCall.args[0]).to.equal('/api/v1/uploads/initiate');
      
      // Verify the response was processed correctly
      expect(result.success).to.be.true;
      expect(result.data?.upload.id).to.equal('upload_123');
      expect(result.data?.upload.size).to.equal(1024000);
      expect(result.data?.upload.status).to.equal('pending');
      expect(result.data?.instructions).to.include('TUS protocol');
    });
    
    it('should handle errors when initiating upload', async () => {
      // Setup the stub to throw an error
      apiClientStub.post.rejects(new Error('Network error'));
      
      // Test upload request
      const request: InitiateUploadRequest = {
        filename: 'test-file.pdf',
        mimeType: 'application/pdf',
        vaultId: 'vault_456',
        parentId: 'folder_789',
        size: 1024000
      };
      
      // Call the method
      const result = await uploadClient.initiateUpload(request);
      
      // Verify error handling
      expect(result.success).to.be.false;
      expect(result.error).to.include('Failed to initiate upload');
    });
    
    it('should include encryption key in metadata when provided', async () => {
      // Mock minimal API response
      apiClientStub.post.resolves({ success: true });
      
      // Test upload request with encryption key
      const request: InitiateUploadRequest = {
        filename: 'encrypted-file.pdf',
        mimeType: 'application/pdf',
        vaultId: 'vault_456',
        parentId: 'folder_789',
        size: 1024000,
        encryptionKey: 'abc123encryption456key789'
      };
      
      // Call the method
      await uploadClient.initiateUpload(request);
      
      // Verify the API was called with the encryption key in metadata
      expect(apiClientStub.post.calledOnce).to.be.true;
      const requestBody = apiClientStub.post.firstCall.args[1];
      expect(requestBody.metadata.encryptionKey).to.equal('abc123encryption456key789');
    });
  });
  
  describe('getUploadStatus', () => {
    it('should get upload status successfully', async () => {
      // Mock API response
      const mockResponse: GetUploadStatusResponse = {
        success: true,
        data: {
          upload: {
            id: 'upload_123',
            uploadUrl: 'https://api.tusky.io/tus/upload_123',
            expiresAt: '2025-04-19T05:30:00Z',
            status: 'in-progress',
            size: 1024000,
            bytesUploaded: 512000
          },
          progress: 50,
          remainingBytes: 512000
        }
      };
      
      // Setup the stub to return the mock response
      apiClientStub.get.resolves({
        success: true,
        data: {
          upload: {
            id: 'upload_123',
            uploadUrl: 'https://api.tusky.io/tus/upload_123',
            expiresAt: '2025-04-19T05:30:00Z',
            status: 'in-progress',
            size: 1024000,
            bytesUploaded: 512000
          }
        }
      });
      
      // Call the method
      const result = await uploadClient.getUploadStatus('upload_123');
      
      // Verify the API was called correctly
      expect(apiClientStub.get.calledOnce).to.be.true;
      expect(apiClientStub.get.firstCall.args[0]).to.equal('/api/v1/uploads/upload_123/status');
      
      // Verify the response was processed correctly
      expect(result.success).to.be.true;
      expect(result.data?.upload.id).to.equal('upload_123');
      expect(result.data?.upload.bytesUploaded).to.equal(512000);
      expect(result.data?.progress).to.equal(50);
      expect(result.data?.remainingBytes).to.equal(512000);
    });
    
    it('should handle errors when getting upload status', async () => {
      // Setup the stub to throw an error
      apiClientStub.get.rejects(new Error('Not found'));
      
      // Call the method
      const result = await uploadClient.getUploadStatus('nonexistent_id');
      
      // Verify error handling
      expect(result.success).to.be.false;
      expect(result.error).to.include('Failed to get upload status');
    });
  });
});

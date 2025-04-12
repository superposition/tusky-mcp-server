// API response interfaces for Tusky integration

export interface TuskyApiResponse {
  // Common Tusky API response properties
  success?: boolean;
  error?: string;
  message?: string;
  data?: any;
}

export interface AuthChallengeResponse extends TuskyApiResponse {
  data?: {
    nonce: string;
    timestamp: string;
    expiresIn: number;
  };
}

export interface VerifyChallengeResponse extends TuskyApiResponse {
  data?: {
    token: string;
    expiresAt: string;
  };
}

// API Key Management interfaces
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

export interface GetApiKeysResponse extends TuskyApiResponse {
  data?: {
    keys: ApiKey[];
  };
}

export interface CreateApiKeyResponse extends TuskyApiResponse {
  data?: {
    key: ApiKey;
    secretKey: string; // Full secret key, only provided once upon creation
  };
}

export interface DeleteApiKeyResponse extends TuskyApiResponse {
  data?: {
    id: string;
    deleted: boolean;
  };
}

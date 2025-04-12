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

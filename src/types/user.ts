// src/types/user.ts

/**
 * Parameters for retrieving a user profile
 */
export interface GetProfileParams {
  /**
   * Whether to include storage usage information
   */
  includeStorage?: boolean;
}

/**
 * Parameters for updating a user profile
 */
export interface UpdateProfileParams {
  /**
   * Display name for the user
   */
  name?: string;
  
  /**
   * Short bio or description
   */
  bio?: string;
  
  /**
   * URL to the user's avatar image
   */
  avatarUrl?: string;
  
  /**
   * User preferences as key-value pairs
   */
  preferences?: Record<string, any>;
}

/**
 * User profile information
 */
export interface UserProfile {
  /**
   * Unique identifier for the user
   */
  id: string;
  
  /**
   * Display name for the user
   */
  name?: string;
  
  /**
   * Short bio or description
   */
  bio?: string;
  
  /**
   * URL to the user's avatar image
   */
  avatarUrl?: string;
  
  /**
   * User's wallet address
   */
  walletAddress: string;
  
  /**
   * User preferences as key-value pairs
   */
  preferences?: Record<string, any>;
  
  /**
   * When the user account was created
   */
  createdAt: string;
  
  /**
   * When the user profile was last updated
   */
  updatedAt: string;
}

/**
 * Storage information for a user
 */
export interface UserStorage {
  /**
   * Total storage allocated to the user (in bytes)
   */
  total: number;
  
  /**
   * Current storage used by the user (in bytes)
   */
  used: number;
  
  /**
   * Storage plan name
   */
  plan?: string;
  
  /**
   * When the storage plan expires (if applicable)
   */
  expiresAt?: string;
}

/**
 * Response data for get-profile tool
 */
export interface GetProfileResponseData {
  /**
   * User profile information
   */
  profile: UserProfile;
  
  /**
   * Storage information (if requested)
   */
  storage?: UserStorage;
}

/**
 * Response data for update-profile tool
 */
export interface UpdateProfileResponseData {
  /**
   * Updated user profile information
   */
  profile: UserProfile;
}

// src/types/vault.ts

import { TuskyApiResponse } from './api';

/**
 * Represents a Vault entity from the Tusky API
 */
export interface Vault {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'deleted';
  ownerId: string;
  ownerName?: string;
  size?: number;
  itemCount?: number;
  permissions?: VaultPermission[];
  tags?: string[];
}

/**
 * Represents permission settings for a vault
 */
export interface VaultPermission {
  userId: string;
  userName?: string;
  access: 'read' | 'write' | 'admin';
  grantedAt: string;
  grantedBy: string;
}

/**
 * Parameters for listing vaults
 */
export interface ListVaultsParams {
  status?: 'active' | 'archived' | 'deleted' | 'all';
  limit?: number;
  nextToken?: string;
  ownedOnly?: boolean;
  tags?: string[];
}

/**
 * Response for listing vaults
 */
export interface ListVaultsResponse extends TuskyApiResponse {
  data?: {
    vaults: Vault[];
    nextToken?: string;
    totalCount?: number;
  };
}

/**
 * Parameters for getting a specific vault
 */
export interface GetVaultParams {
  id: string;
  includePermissions?: boolean;
  includeFiles?: boolean;
  includeFolders?: boolean;
}

/**
 * File entity for Vault response
 */
export interface VaultFile {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
}

/**
 * Folder entity for Vault response
 */
export interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

/**
 * Response for getting a specific vault
 */
export interface GetVaultResponse extends TuskyApiResponse {
  data?: {
    vault: Vault;
    permissions?: VaultPermission[];
    files?: VaultFile[];
    folders?: VaultFolder[];
  };
}
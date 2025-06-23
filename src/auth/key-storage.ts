import { ClerkClient } from './clerk-client.js';
import { getEncryptionService } from './encryption.js';

export interface StoredApiKey {
  twentyApiKey: string;
  twentyBaseUrl?: string;
  twentyApiKeyUpdatedAt: string;
}

/**
 * Service for securely storing and retrieving user API keys
 * Uses Clerk's privateMetadata with encryption
 */
export class KeyStorageService {
  private clerkClient: ClerkClient;
  private encryptionService = getEncryptionService();

  constructor() {
    this.clerkClient = new ClerkClient();
  }

  /**
   * Store an encrypted API key for a user
   */
  async storeApiKey(
    userId: string,
    apiKey: string,
    baseUrl?: string
  ): Promise<void> {
    if (!userId || !apiKey) {
      throw new Error('User ID and API key are required');
    }

    // Encrypt the API key
    const encryptedKey = this.encryptionService.encrypt(apiKey);

    // Prepare metadata
    const metadata: StoredApiKey = {
      twentyApiKey: encryptedKey,
      twentyBaseUrl: baseUrl,
      twentyApiKeyUpdatedAt: new Date().toISOString(),
    };

    // Store in Clerk
    await this.clerkClient.updateUserMetadata(userId, metadata);
  }

  /**
   * Retrieve and decrypt a user's API key
   */
  async getApiKey(userId: string): Promise<StoredApiKey | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user metadata from Clerk
    const metadata = await this.clerkClient.getUserMetadata(userId);
    
    if (!metadata?.twentyApiKey) {
      return null;
    }

    try {
      // Decrypt the API key
      const decryptedKey = this.encryptionService.decrypt(metadata.twentyApiKey);
      
      return {
        twentyApiKey: decryptedKey,
        twentyBaseUrl: metadata.twentyBaseUrl || undefined,
        twentyApiKeyUpdatedAt: metadata.twentyApiKeyUpdatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return null;
    }
  }

  /**
   * Delete a user's API key
   */
  async deleteApiKey(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Clear the metadata
    await this.clerkClient.updateUserMetadata(userId, {
      twentyApiKey: undefined,
      twentyBaseUrl: undefined,
      twentyApiKeyUpdatedAt: undefined,
    });
  }

  /**
   * Validate if a stored API key matches a given key
   */
  async validateApiKey(userId: string, apiKey: string): Promise<boolean> {
    const stored = await this.getApiKey(userId);
    if (!stored) {
      return false;
    }
    return stored.twentyApiKey === apiKey;
  }

  /**
   * Rotate a user's API key
   */
  async rotateApiKey(
    userId: string,
    newApiKey: string,
    baseUrl?: string
  ): Promise<void> {
    // Store the new key (this will overwrite the old one)
    await this.storeApiKey(userId, newApiKey, baseUrl);
  }

  /**
   * Get API key metadata without decrypting
   */
  async getApiKeyMetadata(userId: string): Promise<{
    hasKey: boolean;
    updatedAt?: string;
    baseUrl?: string;
  }> {
    const metadata = await this.clerkClient.getUserMetadata(userId);
    
    return {
      hasKey: !!metadata?.twentyApiKey,
      updatedAt: metadata?.twentyApiKeyUpdatedAt,
      baseUrl: metadata?.twentyBaseUrl,
    };
  }
}

// Singleton instance
let keyStorageService: KeyStorageService | null = null;

/**
 * Get or create the key storage service instance
 */
export function getKeyStorageService(): KeyStorageService {
  if (!keyStorageService) {
    keyStorageService = new KeyStorageService();
  }
  return keyStorageService;
}
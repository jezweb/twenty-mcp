import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Encryption service for securing API keys
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private key: Buffer;
  private algorithm = 'aes-256-gcm' as const;
  private saltLength = 32;
  private tagLength = 16;
  private ivLength = 16;

  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error('Encryption secret must be at least 32 characters');
    }
    
    // Derive a key from the secret using scrypt
    const salt = Buffer.from('twenty-mcp-salt-v1', 'utf8');
    this.key = scryptSync(secret, salt, 32);
  }

  /**
   * Encrypts a string value
   * @returns Base64 encoded string containing: salt + iv + authTag + encrypted data
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty string');
    }

    // Generate random IV
    const iv = randomBytes(this.ivLength);
    
    // Create cipher
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const authTag = (cipher as any).getAuthTag();
    
    // Combine all parts: iv + authTag + encrypted
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    // Return base64 encoded
    return combined.toString('base64');
  }

  /**
   * Decrypts a base64 encoded encrypted string
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      throw new Error('Cannot decrypt empty string');
    }

    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      (decipher as any).setAuthTag(authTag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Failed to decrypt data: invalid key or corrupted data');
    }
  }

  /**
   * Safely compares two encrypted values without decrypting
   */
  compareEncrypted(encrypted1: string, encrypted2: string): boolean {
    try {
      const plain1 = this.decrypt(encrypted1);
      const plain2 = this.decrypt(encrypted2);
      return plain1 === plain2;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

/**
 * Get or create the encryption service instance
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is required');
    }
    encryptionService = new EncryptionService(secret);
  }
  return encryptionService;
}
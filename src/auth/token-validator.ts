import type { IncomingHttpHeaders } from 'node:http';
import { ClerkClient } from './clerk-client.js';

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  sessionId?: string;
  error?: string;
}

export class TokenValidator {
  private clerkClient: ClerkClient;
  private cache: Map<string, { result: TokenValidationResult; expiry: number }>;
  
  constructor(clerkClient: ClerkClient) {
    this.clerkClient = clerkClient;
    this.cache = new Map();
  }
  
  async validateBearerToken(authHeader: string | undefined): Promise<TokenValidationResult> {
    if (!authHeader) {
      return { valid: false, error: 'Missing Authorization header' };
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Invalid Authorization header format' };
    }
    
    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Check cache
    const cached = this.cache.get(token);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }
    
    try {
      // Validate with Clerk
      const result = await this.clerkClient.validateToken(token);
      
      if (result.valid) {
        // Cache successful validation for 5 minutes
        this.cache.set(token, {
          result,
          expiry: Date.now() + 5 * 60 * 1000,
        });
        
        // Clean up old cache entries
        this.cleanCache();
      }
      
      return result;
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }
  
  private cleanCache(): void {
    const now = Date.now();
    for (const [token, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(token);
      }
    }
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}
import { IncomingMessage, ServerResponse } from 'node:http';
import { TokenValidator } from './token-validator.js';

export interface AuthenticatedRequest extends IncomingMessage {
  auth?: {
    userId: string;
    sessionId: string;
  };
}

export interface AuthConfig {
  enabled: boolean;
  required: boolean;
  provider: string;
}

export class AuthMiddleware {
  private tokenValidator: TokenValidator;
  private authEnabled: boolean;
  private requireAuth: boolean;
  
  constructor(tokenValidator: TokenValidator) {
    this.tokenValidator = tokenValidator;
    this.authEnabled = process.env.AUTH_ENABLED === 'true';
    this.requireAuth = process.env.REQUIRE_AUTH === 'true';
  }
  
  async authenticate(
    req: AuthenticatedRequest,
    res: ServerResponse
  ): Promise<boolean> {
    // Skip auth if not enabled
    if (!this.authEnabled) {
      return true;
    }
    
    const authHeader = req.headers.authorization;
    
    // No auth header
    if (!authHeader) {
      if (this.requireAuth) {
        this.sendUnauthorized(res, 'Missing Authorization header');
        return false;
      }
      return true; // Allow anonymous if auth not required
    }
    
    // Validate token
    const result = await this.tokenValidator.validateBearerToken(authHeader);
    
    if (!result.valid) {
      this.sendUnauthorized(res, result.error || 'Invalid token');
      return false;
    }
    
    // Attach user context to request
    req.auth = {
      userId: result.userId!,
      sessionId: result.sessionId!,
    };
    
    return true;
  }
  
  private sendUnauthorized(res: ServerResponse, message: string): void {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer realm="Twenty MCP Server"',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    });
    res.end(JSON.stringify({
      error: 'unauthorized',
      error_description: message,
    }));
  }
  
  getAuthConfig(): AuthConfig {
    return {
      enabled: this.authEnabled,
      required: this.requireAuth,
      provider: process.env.AUTH_PROVIDER || 'clerk',
    };
  }
}
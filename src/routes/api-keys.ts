import { IncomingMessage, ServerResponse } from 'node:http';
import { AuthenticatedRequest } from '../auth/middleware.js';
import { getKeyStorageService } from '../auth/key-storage.js';

/**
 * API routes for managing user API keys
 */
export class ApiKeyRoutes {
  private keyStorage = getKeyStorageService();

  /**
   * Handle API key management requests
   */
  async handle(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    // Must be authenticated
    if (!req.auth) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'unauthorized',
        error_description: 'Authentication required'
      }));
      return;
    }

    const url = new URL(req.url!, `http://localhost`);
    const path = url.pathname;

    // Route to appropriate handler
    if (path === '/api/keys' && req.method === 'GET') {
      await this.getKeyMetadata(req, res);
    } else if (path === '/api/keys' && req.method === 'POST') {
      await this.storeKey(req, res);
    } else if (path === '/api/keys' && req.method === 'DELETE') {
      await this.deleteKey(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  /**
   * Get API key metadata (without revealing the key)
   */
  private async getKeyMetadata(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const metadata = await this.keyStorage.getApiKeyMetadata(req.auth!.userId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        hasKey: metadata.hasKey,
        updatedAt: metadata.updatedAt,
        baseUrl: metadata.baseUrl,
      }));
    } catch (error) {
      console.error('Error getting key metadata:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'internal_error',
        error_description: 'Failed to retrieve key metadata'
      }));
    }
  }

  /**
   * Store a new API key
   */
  private async storeKey(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      // Parse request body
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          
          if (!body.apiKey) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'invalid_request',
              error_description: 'API key is required'
            }));
            return;
          }

          // Store the key
          await this.keyStorage.storeApiKey(
            req.auth!.userId,
            body.apiKey,
            body.baseUrl
          );

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'API key stored successfully'
          }));
        } catch (error) {
          console.error('Error parsing request:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'invalid_request',
            error_description: 'Invalid JSON body'
          }));
        }
      });
    } catch (error) {
      console.error('Error storing key:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'internal_error',
        error_description: 'Failed to store API key'
      }));
    }
  }

  /**
   * Delete the stored API key
   */
  private async deleteKey(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      await this.keyStorage.deleteApiKey(req.auth!.userId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'API key deleted successfully'
      }));
    } catch (error) {
      console.error('Error deleting key:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'internal_error', 
        error_description: 'Failed to delete API key'
      }));
    }
  }
}
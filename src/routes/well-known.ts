import { IncomingMessage, ServerResponse } from 'node:http';

export class WellKnownRoutes {
  private clerkDomain: string;
  private serverUrl: string;
  
  constructor() {
    this.clerkDomain = process.env.CLERK_DOMAIN || '';
    this.serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';
  }
  
  async handleProtectedResource(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // RFC 9728 - OAuth 2.0 Protected Resource Metadata
    const metadata = {
      resource: this.serverUrl,
      authorization_servers: [`https://${this.clerkDomain}`],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://github.com/jezweb/twenty-mcp',
      resource_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['twenty:read', 'twenty:write'],
    };
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(JSON.stringify(metadata, null, 2));
  }
  
  async handleAuthorizationServer(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // RFC 8414 - OAuth 2.0 Authorization Server Metadata
    const metadata = {
      issuer: `https://${this.clerkDomain}`,
      authorization_endpoint: `https://${this.clerkDomain}/oauth/authorize`,
      token_endpoint: `https://${this.clerkDomain}/oauth/token`,
      jwks_uri: `https://${this.clerkDomain}/.well-known/jwks.json`,
      registration_endpoint: `https://${this.clerkDomain}/oauth/register`,
      scopes_supported: ['openid', 'profile', 'email', 'twenty:read', 'twenty:write'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      revocation_endpoint: `https://${this.clerkDomain}/oauth/revoke`,
      introspection_endpoint: `https://${this.clerkDomain}/oauth/introspect`,
      userinfo_endpoint: `https://${this.clerkDomain}/oauth/userinfo`,
    };
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(JSON.stringify(metadata, null, 2));
  }
  
  async handleOptions(req: IncomingMessage, res: ServerResponse): Promise<void> {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
  }
}
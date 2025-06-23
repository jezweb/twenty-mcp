#!/usr/bin/env python3

"""
Example OAuth client for Twenty MCP Server (Python)
Demonstrates the complete OAuth 2.1 flow using Python
"""

import asyncio
import base64
import hashlib
import json
import os
import secrets
import urllib.parse
from typing import Optional, Dict, Any

import aiohttp
import webbrowser
from aiohttp import web

MCP_SERVER_URL = os.getenv('MCP_SERVER_URL', 'http://localhost:3000')
CLIENT_PORT = 8080
REDIRECT_URI = f'http://localhost:{CLIENT_PORT}/callback'

class OAuthClient:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.code_verifier: Optional[str] = None
        self.state: Optional[str] = None
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def generate_pkce(self) -> Dict[str, str]:
        """Generate PKCE parameters for OAuth flow"""
        self.code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(self.code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        return {
            'code_verifier': self.code_verifier,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256'
        }

    def generate_state(self) -> str:
        """Generate random state parameter"""
        self.state = secrets.token_hex(16)
        return self.state

    async def discover_endpoints(self) -> Dict[str, Any]:
        """Step 1: Discover OAuth endpoints"""
        print('🔍 Discovering OAuth endpoints...')
        
        async with self.session.get(f'{MCP_SERVER_URL}/.well-known/oauth-protected-resource') as response:
            if not response.ok:
                raise Exception(f'Discovery failed: {response.status}')
            
            metadata = await response.json()
            print('✅ OAuth endpoints discovered')
            print(f'   Resource: {metadata["resource"]}')
            print(f'   Auth Servers: {", ".join(metadata["authorization_servers"])}')
            
            return metadata

    async def get_auth_server_metadata(self) -> Dict[str, Any]:
        """Step 2: Get authorization server metadata"""
        print('📋 Getting authorization server metadata...')
        
        async with self.session.get(f'{MCP_SERVER_URL}/.well-known/oauth-authorization-server') as response:
            if not response.ok:
                raise Exception(f'Auth server discovery failed: {response.status}')
            
            metadata = await response.json()
            print('✅ Authorization server metadata retrieved')
            print(f'   Issuer: {metadata["issuer"]}')
            print(f'   Auth Endpoint: {metadata["authorization_endpoint"]}')
            print(f'   Token Endpoint: {metadata["token_endpoint"]}')
            
            return metadata

    async def start_auth_flow(self, auth_server_metadata: Dict[str, Any]) -> str:
        """Step 3: Start authorization flow"""
        pkce_params = self.generate_pkce()
        state = self.generate_state()
        
        # Build authorization URL
        auth_params = {
            'response_type': 'code',
            'client_id': 'YOUR_CLIENT_ID',  # Would be from Clerk
            'redirect_uri': REDIRECT_URI,
            'scope': 'twenty:read twenty:write',
            'code_challenge': pkce_params['code_challenge'],
            'code_challenge_method': pkce_params['code_challenge_method'],
            'state': state
        }
        
        auth_url = f"{auth_server_metadata['authorization_endpoint']}?{urllib.parse.urlencode(auth_params)}"
        
        print('🚀 Starting OAuth authorization flow...')
        print(f'   Authorization URL: {auth_url}')
        
        # For demo purposes, simulate getting an auth code
        print('ℹ️  In a real app, user would be redirected to authorize')
        print('ℹ️  For this demo, we\'ll simulate the callback with a mock token')
        
        return await self.simulate_callback()

    async def simulate_callback(self) -> str:
        """Simulate the OAuth callback"""
        print('🔄 Simulating OAuth callback...')
        
        # In a real implementation, this would be a real authorization code
        self.access_token = 'mock_access_token_' + secrets.token_hex(16)
        
        print('✅ Authorization completed (simulated)')
        print(f'   Access Token: {self.access_token[:20]}...')
        
        return self.access_token

    async def store_api_key(self, api_key: str, base_url: str = 'https://api.twenty.com') -> bool:
        """Step 4: Store user's Twenty API key"""
        print('💾 Storing Twenty API key...')
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'apiKey': api_key,
            'baseUrl': base_url
        }
        
        async with self.session.post(f'{MCP_SERVER_URL}/api/keys', 
                                   headers=headers, 
                                   json=data) as response:
            if response.status == 401:
                print('❌ Authentication failed (expected with mock token)')
                print('ℹ️  In production, use real Clerk tokens')
                return False
            
            if not response.ok:
                raise Exception(f'Failed to store API key: {response.status}')
            
            result = await response.json()
            print('✅ API key stored successfully')
            return True

    async def get_api_key_metadata(self) -> Optional[Dict[str, Any]]:
        """Step 5: Get API key metadata"""
        print('📊 Getting API key metadata...')
        
        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }
        
        async with self.session.get(f'{MCP_SERVER_URL}/api/keys', headers=headers) as response:
            if response.status == 401:
                print('❌ Authentication failed (expected with mock token)')
                return None
            
            if not response.ok:
                raise Exception(f'Failed to get metadata: {response.status}')
            
            metadata = await response.json()
            print('✅ API key metadata retrieved')
            print(f'   Has Key: {metadata["hasKey"]}')
            print(f'   Base URL: {metadata.get("baseUrl", "default")}')
            print(f'   Updated: {metadata.get("updatedAt", "never")}')
            
            return metadata

    async def make_mcp_request(self) -> Optional[str]:
        """Step 6: Make authenticated MCP request"""
        print('🔗 Making authenticated MCP request...')
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'jsonrpc': '2.0',
            'method': 'initialize',
            'params': {},
            'id': 1
        }
        
        async with self.session.post(f'{MCP_SERVER_URL}/mcp', 
                                   headers=headers, 
                                   json=data) as response:
            if response.status == 401:
                print('❌ Authentication failed (expected with mock token)')
                print('ℹ️  In production, use real Clerk tokens')
                return None
            
            if response.status == 400:
                error = await response.json()
                if error.get('error') == 'No API key configured':
                    print('ℹ️  User needs to configure their Twenty API key first')
                    return None
            
            print(f'📤 MCP Response Status: {response.status}')
            result = await response.text()
            print(f'📥 MCP Response: {result[:200]}...')
            
            return result

    async def run_complete_flow(self):
        """Complete OAuth flow demo"""
        try:
            print('🎯 OAuth 2.1 Flow Demo for Twenty MCP Server (Python)')
            print('═══════════════════════════════════════════════════════')
            print('')

            # Step 1: Discovery
            endpoints = await self.discover_endpoints()
            print('')

            # Step 2: Get auth server metadata
            auth_metadata = await self.get_auth_server_metadata()
            print('')

            # Step 3: Authorization flow
            await self.start_auth_flow(auth_metadata)
            print('')

            # Step 4: Store API key
            test_api_key = 'demo-twenty-api-key-12345'
            await self.store_api_key(test_api_key)
            print('')

            # Step 5: Get metadata
            await self.get_api_key_metadata()
            print('')

            # Step 6: Make MCP request
            await self.make_mcp_request()
            print('')

            print('🎉 OAuth flow demo completed!')
            print('')
            print('📝 Summary:')
            print('   ✅ OAuth endpoints discovered')
            print('   ✅ Authorization flow initiated')
            print('   ✅ API key management tested')
            print('   ✅ MCP request attempted')
            print('')
            print('ℹ️  To test with real tokens:')
            print('   1. Set up Clerk application')
            print('   2. Configure client credentials')
            print('   3. Implement real authorization flow')
            print('   4. Use real Bearer tokens')

        except Exception as error:
            print(f'❌ Demo failed: {error}')
            raise

class CallbackServer:
    """Real OAuth callback server for production use"""
    
    def __init__(self, client: OAuthClient):
        self.client = client
        self.app = web.Application()
        self.app.router.add_get('/callback', self.handle_callback)
        self.runner = None

    async def handle_callback(self, request: web.Request) -> web.Response:
        """Handle OAuth callback"""
        query = request.query
        
        if 'error' in query:
            return web.Response(
                text=f'<h1>Authorization Error</h1><p>{query["error"]}</p>',
                content_type='text/html',
                status=400
            )
        
        if query.get('state') != self.client.state:
            return web.Response(
                text='<h1>Invalid State</h1><p>State parameter mismatch</p>',
                content_type='text/html',
                status=400
            )
        
        code = query.get('code')
        if not code:
            return web.Response(
                text='<h1>Missing Code</h1><p>No authorization code received</p>',
                content_type='text/html',
                status=400
            )
        
        print(f'📨 Received authorization code: {code}')
        
        # Here you would exchange the code for an access token
        # For demo purposes, we'll just acknowledge receipt
        
        return web.Response(
            text='''
            <h1>Authorization Successful!</h1>
            <p>You can close this window and return to the application.</p>
            <script>window.close();</script>
            ''',
            content_type='text/html'
        )

    async def start(self):
        """Start the callback server"""
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, 'localhost', CLIENT_PORT)
        await site.start()
        print(f'🌐 Callback server listening on http://localhost:{CLIENT_PORT}')

    async def stop(self):
        """Stop the callback server"""
        if self.runner:
            await self.runner.cleanup()

async def main():
    """Run the demo"""
    # Check if MCP server is running
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f'{MCP_SERVER_URL}/health') as response:
                if not response.ok:
                    raise Exception('Server not responding')
                health = await response.json()
                if not health.get('authEnabled'):
                    print('⚠️  Warning: Auth is not enabled on the MCP server')
                    print('   Run "npm run setup:oauth" to enable authentication')
        except Exception as error:
            print(f'❌ Cannot connect to MCP server at {MCP_SERVER_URL}')
            print('   Make sure the server is running: npm start')
            return

    # Run the OAuth flow demo
    async with OAuthClient() as client:
        await client.run_complete_flow()

if __name__ == '__main__':
    # Check dependencies
    try:
        import aiohttp
    except ImportError:
        print('❌ Missing dependency: aiohttp')
        print('   Install with: pip install aiohttp')
        exit(1)
    
    asyncio.run(main())
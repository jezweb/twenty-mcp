# IP Protection Configuration

The Twenty MCP Server includes IP allowlist functionality to restrict server access based on client IP addresses. This provides network-level security for sensitive deployments.

## Overview

IP protection works by:
1. Checking the client's IP address before processing any requests
2. Comparing it against a configured allowlist of permitted IPs/CIDR ranges
3. Blocking or allowing access based on the match results
4. Always allowing localhost connections for local development

## Configuration

IP protection is configured through environment variables:

### Basic Configuration

```bash
# Enable IP protection
IP_PROTECTION_ENABLED=true

# Comma-separated list of allowed IP addresses and CIDR blocks
IP_ALLOWLIST=192.168.1.0/24,10.0.0.0/8,203.0.113.100

# Block connections when client IP cannot be determined (recommended)
IP_BLOCK_UNKNOWN=true
```

### Reverse Proxy Configuration

If your server is behind a reverse proxy (nginx, CloudFlare, AWS ALB, etc.), you need to configure trusted proxies to properly read client IPs from headers:

```bash
# Comma-separated list of trusted proxy IPs
TRUSTED_PROXIES=127.0.0.1,10.0.0.1,172.16.0.0/12

# The server will read X-Forwarded-For and X-Real-IP headers from these IPs
```

## Supported IP Formats

### IPv4 Examples
```bash
# Single IP address
IP_ALLOWLIST=192.168.1.100

# CIDR range
IP_ALLOWLIST=192.168.1.0/24

# Multiple entries
IP_ALLOWLIST=192.168.1.0/24,10.0.0.100,172.16.0.0/12
```

### IPv6 Examples
```bash
# IPv6 single address
IP_ALLOWLIST=2001:db8::1

# IPv6 CIDR range
IP_ALLOWLIST=2001:db8::/32

# Mixed IPv4 and IPv6
IP_ALLOWLIST=192.168.1.0/24,2001:db8::/32,::1
```

## Setup via OAuth CLI

The easiest way to configure IP protection is through the OAuth setup wizard:

```bash
npm run setup:oauth
```

The wizard will guide you through:
1. Enabling IP protection
2. Adding allowed IP addresses/ranges
3. Configuring trusted proxies
4. Setting unknown IP handling

## Manual Configuration

### 1. Create/Update .env File

```bash
# Copy example configuration
cp .env.example .env

# Edit the IP protection section
nano .env
```

### 2. Configure IP Protection

Add these lines to your `.env` file:

```bash
# Enable IP protection
IP_PROTECTION_ENABLED=true

# Define your allowed networks
IP_ALLOWLIST=192.168.1.0/24,10.0.0.0/8

# Configure reverse proxy if needed
TRUSTED_PROXIES=127.0.0.1

# Security policy for unknown IPs
IP_BLOCK_UNKNOWN=true
```

### 3. Start the Server

```bash
npm start
```

## Common Use Cases

### Corporate Network
```bash
IP_PROTECTION_ENABLED=true
IP_ALLOWLIST=10.0.0.0/8,172.16.0.0/12
IP_BLOCK_UNKNOWN=true
```

### VPN-Only Access
```bash
IP_PROTECTION_ENABLED=true
IP_ALLOWLIST=192.168.100.0/24
TRUSTED_PROXIES=10.0.0.1
IP_BLOCK_UNKNOWN=true
```

### CloudFlare with Corporate Network
```bash
IP_PROTECTION_ENABLED=true
IP_ALLOWLIST=203.0.113.0/24
TRUSTED_PROXIES=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22
IP_BLOCK_UNKNOWN=true
```

### Development with Specific IPs
```bash
IP_PROTECTION_ENABLED=true
IP_ALLOWLIST=192.168.1.100,192.168.1.101,192.168.1.102
IP_BLOCK_UNKNOWN=false
```

## Security Considerations

### Always Allowed
- `127.0.0.1` (IPv4 localhost)
- `::1` (IPv6 localhost)
- `::ffff:127.0.0.1` (IPv4-mapped IPv6 localhost)

### Header Security
- Only reads proxy headers from trusted proxy IPs
- Ignores `X-Forwarded-For` and `X-Real-IP` from untrusted sources
- Falls back to socket IP when headers are unavailable

### Default Behavior
- IP protection is **disabled** by default
- Unknown IP handling defaults to **block** when enabled
- Empty allowlist blocks all non-localhost connections

## Testing

### Health Check
```bash
curl http://localhost:3000/health
```

Response includes IP protection status:
```json
{
  "status": "healthy",
  "service": "twenty-mcp-server",
  "authEnabled": false,
  "ipProtection": true
}
```

### Forbidden Access
When an IP is blocked, the server returns:
```bash
HTTP 403 Forbidden
{
  "error": "forbidden",
  "error_description": "Access denied for IP: 203.0.113.1"
}
```

### Run IP Protection Tests
```bash
# Run comprehensive IP protection test suite
TWENTY_API_KEY=your-key node tests/ip-protection-tests.js
```

## Troubleshooting

### Common Issues

**Server blocks localhost**
- Check that IP protection isn't blocking localhost (it shouldn't)
- Verify `IP_PROTECTION_ENABLED=true` is set correctly

**Corporate network blocked**
- Add your corporate IP range to `IP_ALLOWLIST`
- Check if you're behind a proxy and configure `TRUSTED_PROXIES`

**Headers not working**
- Ensure proxy IP is in `TRUSTED_PROXIES`
- Verify proxy sends `X-Forwarded-For` or `X-Real-IP` headers

**Configuration not applying**
- Restart the server after changing `.env`
- Check for typos in environment variable names
- Verify CIDR notation is correct

### Debug Tips

1. **Check IP detection**:
   ```bash
   # Add debug logging to see detected IPs
   DEBUG=twenty-mcp:* npm start
   ```

2. **Test from different networks**:
   ```bash
   # Use different source IPs if available
   curl --interface eth1 http://localhost:3000/health
   ```

3. **Validate CIDR ranges**:
   ```bash
   # Use online CIDR calculators to verify ranges
   # Example: 192.168.1.0/24 includes 192.168.1.1-192.168.1.254
   ```

## Integration with Other Security Features

IP protection works alongside other security features:

### With OAuth Authentication
```bash
# Both IP protection and OAuth can be enabled
IP_PROTECTION_ENABLED=true
AUTH_ENABLED=true

# IP protection is checked first, then OAuth
```

### With API Keys
```bash
# IP protection applies to all endpoints
# Including those protected by Twenty API keys
IP_PROTECTION_ENABLED=true
TWENTY_API_KEY=your-api-key
```

## Performance Impact

IP protection adds minimal overhead:
- ~1-2ms per request for IP checking
- CIDR calculations are optimized
- Localhost bypass for development
- No impact when disabled

## Monitoring

Monitor IP protection through:
- Health endpoint (`/health`) shows protection status
- Server logs show blocked connections
- Test suite validates configuration

## Best Practices

1. **Start Restrictive**: Begin with specific IPs, expand as needed
2. **Use CIDR Ranges**: More maintainable than individual IPs
3. **Configure Proxies**: Essential for production deployments
4. **Test Thoroughly**: Verify access from all expected networks
5. **Monitor Logs**: Watch for blocked legitimate connections
6. **Document Networks**: Keep records of allowed IP ranges

## Migration

### From No Protection
1. Enable IP protection with wide ranges
2. Monitor for blocked legitimate traffic
3. Gradually restrict to required networks

### From Firewall Rules
1. Migrate firewall rules to IP allowlist
2. Test application-level protection
3. Keep firewall as backup layer

## Related Configuration

- [OAuth Setup](OAUTH.md) - User authentication
- [Environment Variables](.env.example) - Complete configuration reference
- [Security Best Practices](SECURITY.md) - Comprehensive security guide
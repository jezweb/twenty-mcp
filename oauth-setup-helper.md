# OAuth Setup Helper

## Quick Answers for OAuth Setup

When running `npm run setup:oauth`, here are the recommended responses:

1. **Enable OAuth authentication?** → `y` (yes)
   - This adds login functionality to your server

2. **Clerk Publishable Key** → `pk_test_b3V0Z29pbmctbW9zcXVpdG8tMjEuY2xlcmsuYWNjb3VudHMuZGV2JA`
   - This is your public key that identifies your app

3. **Clerk Secret Key** → `sk_test_nouhKDGdzGjd3wMdV1Rt5Cxj1TwuZ8CiJjq9SGreIy`
   - This is your private key for server-side authentication

4. **Require authentication for all requests?** → Press Enter (NO)
   - NO = Both OAuth and API key methods work (recommended)
   - YES = Only OAuth works, blocks API key access

5. **Generate a new encryption secret?** → `y` (yes)
   - This creates a secure key to encrypt stored API keys

## What Each Option Means

### Authentication vs CRM Access
**Important**: There are TWO layers of security:
1. **Twenty API Key** (ALWAYS required) - gives access to your CRM data
2. **User Authentication** (OPTIONAL) - identifies who is using the server

Without a valid Twenty API key, connections will be refused regardless of authentication mode.

### Authentication Modes
- **FLEXIBLE MODE (recommended)**: Users can connect with just their Twenty API key, OR login with OAuth first
- **STRICT MODE**: Users MUST login with OAuth first, then use their Twenty API key

### Encryption Secret
- Protects users' Twenty API keys when stored
- Like a master password for a password vault
- Always use a generated one for security

## After Setup

1. Your `.env` file will be updated
2. Start the server: `npm start`
3. Test OAuth endpoints: `npm run test:oauth`

## Testing OAuth vs API Key Mode

**API Key Mode** (always works):
```bash
curl "http://localhost:3000/mcp?apiKey=YOUR_KEY"
```

**OAuth Mode** (when enabled):
```bash
# First authenticate with Clerk, then:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/mcp
```
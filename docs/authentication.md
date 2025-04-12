# Tusky MCP Server - Authentication

This document describes the authentication system implemented in the Tusky MCP Server, which provides wallet-based authentication for the Tusky storage service.

## Authentication Flow

The Tusky MCP Server uses a challenge-response authentication pattern that works with crypto wallets (like Sui wallet). The flow is as follows:

1. The client obtains a challenge from the server using the `create-challenge` tool
2. The client signs the challenge with their wallet's private key
3. The client submits the signature to the server using the `verify-challenge` tool
4. The server verifies the signature and issues an authentication token
5. The token is stored in the server and used for subsequent authenticated requests

## Authentication Tools

### create-challenge

This tool initiates the wallet authentication process by requesting a challenge for a specific wallet address.

**Input:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "nonce": "random-challenge-string",
    "timestamp": "2025-04-11T15:30:45Z",
    "expiresIn": 300
  }
}
```

### verify-challenge

This tool completes the authentication process by verifying the signature of the challenge.

**Input:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "signed-challenge-data",
  "nonce": "random-challenge-string"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-authentication-token",
    "expiresAt": "2025-04-12T15:30:45Z"
  }
}
```

## Using Authentication with MCP

### Example: Authentication Flow in Claude/MCP

Here's how to authenticate with Tusky using Claude and the Model Context Protocol:

1. First, obtain a challenge for your wallet address:

```
I'd like to authenticate with Tusky using my wallet. My wallet address is 0x1234567890abcdef1234567890abcdef12345678.
```

2. Claude will use the `create-challenge` tool, which gives you a nonce to sign with your wallet:

```
I've created an authentication challenge for your wallet. 
Please sign this message with your wallet:

Nonce: abc123def456
Timestamp: 2025-04-11T15:30:45Z
Expires in: 300 seconds
```

3. Sign the nonce with your wallet, and provide the signature to Claude:

```
I've signed the nonce with my wallet. The signature is: 0x9876543210fedcba9876543210fedcba98765432...
```

4. Claude will verify the signature using the `verify-challenge` tool:

```
Authentication successful! Your Tusky account is now accessible.
```

## Error Handling

The authentication tools handle various error conditions:

- Invalid wallet address format
- Missing or malformed signature
- Expired challenge
- Invalid signature
- Network errors

When an error occurs, the tool will return a response with `success: false` and an error message.

## Security Considerations

- Challenges expire after a short period (typically 5 minutes)
- Signatures are validated against the original challenge nonce
- Authentication tokens are securely stored in the server
- API responses do not expose sensitive information

## Next Steps

After successful authentication, you can use the other Tusky MCP tools to:

- List and manage vaults
- Browse folders and files
- Upload and download content
- Share resources with other users

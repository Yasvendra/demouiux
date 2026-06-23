# Token Authorization Feature

This document describes how the token authorization feature works in the admin panel application.

## Overview

When a user clicks a button in another application, they are redirected to this application with a token in the URL. The application automatically validates this token and either grants access to the dashboard or shows an error message.

## URL Format

The expected URL format is:
```
http://localhost:5174/api/v1/users/authorize?token=<JWT_TOKEN>
```

Example:
```
http://localhost:5174/api/v1/users/authorize?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3MDU2NzI0MDAsImV4cCI6MTcwNTY3NjAwMH0.example
```

## How It Works

1. **Token Detection**: The `TokenAuthHandler` component monitors the URL for token parameters
2. **Token Validation**: 
   - Checks if the token has the correct JWT format (3 parts separated by dots)
   - Validates if the token has expired
   - Calls the authorization API endpoint
3. **Authorization Process**:
   - If successful: User is redirected to `/dashboard`
   - If failed: User is redirected to landing page with error message
4. **URL Cleanup**: The token is removed from the URL after processing

## Components

### TokenAuthHandler
- Located in `src/components/TokenAuthHandler.tsx`
- Handles token validation and authorization
- Shows loading state during processing
- Manages navigation based on authorization result

### Token Utilities
- Located in `src/utils/tokenUtils.ts`
- Provides helper functions for token processing
- Includes format validation and expiration checking

## Error Handling

The application handles various error scenarios:

1. **Invalid Token Format**: Shows "Invalid token format" error
2. **Expired Token**: Shows "Authorization token has expired" error
3. **API Authorization Failure**: Shows the specific error from the API
4. **Network Errors**: Shows generic "Authorization failed" error

## Security Features

- Tokens are validated before making API calls
- URL is cleaned of tokens after processing
- Expired tokens are rejected immediately
- Invalid token formats are rejected

## Integration

To integrate with another application:

1. Generate a JWT token with user information
2. Redirect users to: `http://localhost:5174/api/v1/users/authorize?token=<JWT_TOKEN>`
3. The application will handle the rest automatically

## API Endpoint

The application expects the authorization API endpoint to be available at:
```
GET /api/v1/users/authorize?token=<JWT_TOKEN>
```

Expected response format:
```json
{
  "statusCode": 200,
  "data": {
    "isAuthorized": true,
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "email@example.com",
      "role_id": 2,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": {
      "isValid": true,
      "expiresAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
``` 
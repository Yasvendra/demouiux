# Authorization Route Implementation

## Overview

This document describes the implementation of the authorization route that handles token-based authentication for the application.

## Route Details

- **URL Pattern**: `/authorize?token=<jwt_token>&postid=<post_id>`
- **Method**: GET
- **Purpose**: Validates JWT tokens and authenticates users

## Implementation Components

### 1. Authorization Page (`src/pages/auth/Authorize.tsx`)

The main component that handles the authorization flow:

- Extracts token and post ID from URL parameters
- Validates token through the API
- Stores authorization data in Redux and localStorage
- Navigates to landing page after successful authorization

### 2. Updated Redux Store (`src/redux/slices/userSlice.ts`)

Added new state properties:
- `authorizedPostId`: Stores the post ID from the authorization URL
- `isAuthorizing`: Loading state during authorization
- `authorizationError`: Error state for authorization failures

### 3. Enhanced useAuth Hook (`src/hooks/useAuth.ts`)

Updated `authorizeWithToken` function to:
- Accept optional post ID parameter
- Store post ID in Redux and localStorage
- Handle authorization response properly

### 4. Updated Landing Page (`src/pages/landingPage.tsx`)

Enhanced to display:
- Success messages after authorization
- Post ID information when available
- Error messages for failed authorization

## API Integration

The authorization route integrates with the backend API:

```bash
GET http://localhost:8080/api/v1/users/authorize?token=<jwt_token>
```

### Expected Response Format

```json
{
  "statusCode": 200,
  "message": "Authorization successful",
  "data": {
    "isAuthorized": true,
    "user": {
      "id": "649a023a-587f-476c-87fd-ee9ed0173744",
      "username": "yashendra",
      "email": "yashendra@gmail.com",
      "role_id": 2,
      "is_active": true,
      "created_at": "2025-08-03T09:19:50.994Z"
    },
    "token": {
      "isValid": true,
      "expiresAt": "2025-08-11T17:05:43.000Z"
    }
  }
}
```

## Usage Examples

### 1. Basic Authorization

```
http://localhost:5175/authorize?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Authorization with Post ID

```
http://localhost:5175/authorize?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&postid=3f90a6e7-d8ac-461e-8b41-270a243b4f04
```

## Flow Description

1. **URL Parsing**: The component extracts token and post ID from URL parameters
2. **Token Validation**: Makes API call to validate the JWT token
3. **Data Storage**: Stores user data, token, and post ID in Redux and localStorage
4. **Navigation**: Redirects to landing page with success/error message
5. **State Management**: Updates authentication state throughout the application

## Error Handling

The implementation handles various error scenarios:

- **Invalid Token**: Shows error message and redirects to home
- **Network Errors**: Displays network error messages
- **Missing Token**: Redirects to home with appropriate error message
- **Already Authenticated**: Shows success message and continues to landing page

## Security Considerations

- Tokens are validated server-side before authentication
- URL parameters are cleared after successful authorization
- Authentication state is properly managed in Redux
- Error messages don't expose sensitive information

## Testing

The implementation includes comprehensive tests covering:

- Loading states during authorization
- Error handling for various scenarios
- Successful authorization flow
- Post ID handling
- Navigation behavior

## Integration Points

- **Redux Store**: Manages authentication state and post ID
- **React Router**: Handles navigation and URL parameters
- **Local Storage**: Persists tokens and post ID
- **API Utils**: Handles HTTP requests and error handling
- **Landing Page**: Displays authorization results

## Future Enhancements

Potential improvements for the authorization system:

1. **Token Refresh**: Implement automatic token refresh
2. **Session Management**: Add session timeout handling
3. **Multi-factor Authentication**: Support for additional security layers
4. **Audit Logging**: Track authorization attempts and results
5. **Rate Limiting**: Prevent abuse of authorization endpoints

# Post Authentication Flow Documentation

This document explains how the authentication flow works with post fetching functionality in the application.

## Overview

The application now supports a complete flow where:
1. A user receives a URL with both a `token` and `postId` parameter
2. The user is automatically authenticated using the token
3. After successful authentication, the post details are fetched using the postId
4. The user is redirected to the appropriate page

## URL Format

The authentication URL should follow this format:
```
https://yourapp.com/?token=YOUR_AUTH_TOKEN&postId=POST_ID
```

### Parameters:
- `token`: The authentication token (required)
- `postId`: The ID of the post to fetch after authentication (optional)

## Implementation Details

### 1. URL Parameter Extraction

The application uses utility functions in `src/utils/tokenUtils.ts` to extract parameters:

```typescript
import { getTokenAndPostIdFromUrl } from '../utils/tokenUtils';

const { token, postId } = getTokenAndPostIdFromUrl();
```

### 2. Authentication Hook

The `useAuth` hook provides the `authenticateAndFetchPost` function:

```typescript
import { useAuth } from '../hooks/useAuth';

const { authenticateAndFetchPost } = useAuth();

// Complete flow: authenticate + fetch post
const result = await authenticateAndFetchPost(token, postId);
```

### 3. Post Details Hook

The `usePostDetails` hook handles post fetching:

```typescript
import { usePostDetails } from '../hooks/usePostDetails';

const { post, isLoading, error, fetchPostAfterAuth } = usePostDetails();

// Fetch post after authentication
await fetchPostAfterAuth(postId);
```

### 4. Redux State Management

The application stores the authorized post ID in Redux:

```typescript
// In userSlice.ts
authorizedPostId: string | null

// Actions
setAuthorizedPostId(postId: string | null)
```

## Usage Examples

### Example 1: Using the PostAuthHandler Component

The `PostAuthHandler` component provides a complete solution:

```typescript
import PostAuthHandler from '../components/PostAuthHandler';

// Add to your app
<PostAuthHandler />
```

This component will:
- Automatically detect token and postId from URL
- Handle authentication
- Fetch post details
- Show loading states and error handling
- Clean up URL parameters

### Example 2: Manual Implementation

```typescript
import { useAuth } from '../hooks/useAuth';
import { usePostDetails } from '../hooks/usePostDetails';
import { getTokenAndPostIdFromUrl } from '../utils/tokenUtils';

const MyComponent = () => {
  const { authenticateAndFetchPost } = useAuth();
  const { post } = usePostDetails();
  
  const handleAuth = async () => {
    const { token, postId } = getTokenAndPostIdFromUrl();
    
    if (token) {
      const result = await authenticateAndFetchPost(token, postId);
      if (result.success) {
        console.log('Authentication successful');
        console.log('Post data:', post);
      }
    }
  };
  
  return (
    <div>
      <button onClick={handleAuth}>Authenticate and Load Post</button>
      {post && <div>Post: {post.title}</div>}
    </div>
  );
};
```

### Example 3: Using the TopNavBar Authorization

The existing `TopNavBar` component has been updated to support this flow:

```typescript
// The authorization button will automatically:
// 1. Extract token and postId from URL
// 2. Authenticate the user
// 3. Fetch post details
// 4. Navigate to dashboard
```

## Error Handling

The system provides comprehensive error handling:

1. **Invalid Token**: Shows error message and redirects to home
2. **Expired Token**: Shows expiration message
3. **Post Fetch Failure**: Shows post loading error (doesn't fail authentication)
4. **Network Errors**: Shows appropriate error messages

## URL Cleanup

After successful authentication, the URL parameters are automatically cleaned:

```typescript
import { cleanUrlFromTokenAndPostId } from '../utils/tokenUtils';

// Cleans both token and postId from URL
cleanUrlFromTokenAndPostId();
```

## State Flow

1. **Initial State**: URL contains `token` and `postId`
2. **Token Storage**: Token is stored in Redux state
3. **Authentication**: User is authenticated using the token
4. **Post ID Storage**: Post ID is stored in Redux state
5. **Post Fetching**: Post details are fetched using the post ID
6. **URL Cleanup**: URL parameters are removed
7. **Navigation**: User is redirected to appropriate page

## API Endpoints

The system uses these endpoints:

- **Authentication**: `GET /users/authorize?token={token}`
- **Post Details**: `GET /posts/{postId}`

## Security Considerations

1. **Token Validation**: Tokens are validated for format and expiration
2. **URL Cleanup**: Sensitive parameters are removed from URL after use
3. **Error Handling**: Failed authentication doesn't expose sensitive information
4. **State Management**: Tokens are stored securely in localStorage and Redux

## Testing

To test the flow:

1. Create a URL with token and postId parameters
2. Navigate to the URL
3. Verify authentication succeeds
4. Verify post details are loaded
5. Verify URL is cleaned
6. Verify proper navigation occurs

Example test URL:
```
http://localhost:3000/?token=test_token_123&postId=post_456
```
